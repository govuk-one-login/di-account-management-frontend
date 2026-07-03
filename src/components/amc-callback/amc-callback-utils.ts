import { kmsService } from "../../utils/kms.js";
import { ParsedQs } from "qs";
import { AxiosRequestConfig } from "axios";
import {
  getAmcTokenUrl,
  getAmcJourneyOutcomeUrl,
  getAmcClientId,
} from "../../config.js";
import { Request, Response } from "express";
import { handleLogout } from "../../utils/logout.js";
import {
  LogoutState,
  PATH_DATA,
  HTTP_STATUS_CODES,
  EventName,
  JourneyAction,
} from "../../app.constants.js";
import { http } from "../../utils/http.js";
import { randomUUID } from "node:crypto";
import * as jose from "jose";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { eventService } from "../../services/event-service.js";
import { getAmcRedirectUri } from "../../utils/getAmcRedirectUri.js";
import { EventServiceInterface, Extensions } from "src/services/types.js";

enum Scope {
  testingJourney = "testing-journey",
  accountDelete = "account-delete",
  passkeyCreate = "passkey-create",
}

enum Action {
  passkeyCreate = "passkey-create",
}

interface JourneyOutcome {
  outcome_id: string;
  sub: string;
  email: string;
  scope: Scope;
  success: boolean;
  actions: {
    action: string;
    startedAt: number;
    completedAt: number;
    success: boolean;
    details: {
      aaguid?: string;
      accountInterventionsStatus?: {
        state: {
          blocked: boolean;
          suspended: boolean;
          reproveIdentity?: boolean;
          resetPassword?: boolean;
        };
      };
      error?: {
        code: number;
        description: string;
      };
    };
  }[];
}

export type ValidQueryStringParams =
  | {
      scope: string;
      state: string;
      code: string;
      error?: never;
      error_description?: never;
    }
  | {
      scope: string;
      state: string;
      error: string;
      error_description: string;
      code?: never;
    };

export interface TokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
}

export function isValidTokenResponse(data: TokenResponse): boolean {
  return (
    typeof data?.access_token === "string" &&
    data?.token_type === "Bearer" &&
    typeof data?.expires_in === "number"
  );
}

export function validateQueryParams(
  query: ParsedQs,
  userStates: string[]
): asserts query is ValidQueryStringParams {
  const queryStateIsValid =
    typeof query.state === "string" && userStates.includes(query.state);
  const hasCode = typeof query.code === "string";
  const hasScope = typeof query.scope === "string";
  const hasError =
    typeof query.error === "string" &&
    typeof query.error_description === "string";

  if (!hasScope) {
    throw new Error("Invalid request: Must provide 'scope'");
  }

  if (!query.state) {
    throw new Error("Invalid request: Must provide 'state'");
  }

  if (!queryStateIsValid) {
    throw new Error(
      "Invalid request: 'state' parameter and user session state are different"
    );
  }

  if (!hasCode && !hasError) {
    throw new Error(
      "Invalid request: Must provide 'code' or 'error' and 'error_description'."
    );
  }
}

export async function exchangeCodeForToken(
  code: string,
  scope: string,
  requestConfig: AxiosRequestConfig
): Promise<TokenResponse> {
  requestConfig.headers = {
    ...requestConfig.headers,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  delete requestConfig.headers["Authorization"];
  const tokenUrl = getAmcTokenUrl();
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "RS512",
    typ: "JWT",
    kid: kmsService.getPublicKey(),
  };

  const payload = {
    iss: getAmcClientId(),
    aud: tokenUrl,
    iat: now,
    exp: now + 120,
    jti: randomUUID(),
  };

  const tokenParts = `${jose.base64url.encode(JSON.stringify(header))}.${jose.base64url.encode(JSON.stringify(payload))}`;

  const { Signature } = await kmsService.sign(tokenParts);
  const base64Signature = jose.base64url.encode(Signature);
  const clientAssertion = `${tokenParts}.${base64Signature}`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    redirect_uri: getAmcRedirectUri(scope),
    code: code,
    client_assertion_type:
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: clientAssertion,
  });

  const response = await http.client.post(
    tokenUrl,
    body.toString(),
    requestConfig
  );

  return response.data;
}

export async function getJourneyOutcomeResponse(
  access_token: string,
  requestConfig: AxiosRequestConfig
): Promise<JourneyOutcome> {
  requestConfig.headers = {
    ...requestConfig.headers,
    Authorization: `Bearer ${access_token}`,
  };

  const response = await http.client.get(
    getAmcJourneyOutcomeUrl(),
    requestConfig
  );
  return response.data;
}

export async function handleJourneyOutcomeResponse(
  req: Request,
  res: Response,
  outcome: JourneyOutcome
): Promise<void> {
  const { scope, actions, outcome_id, success } = outcome;

  const isPasskeyCreateJourney = scope === Scope.passkeyCreate;

  const userAbortedJourney = actions.find(
    (item) => item.details.error?.code === 1002
  );
  const userSignedOut = actions.find(
    (item) => item.details.error?.code === 1001
  );
  const accountHasInterventions = actions.find(
    (item) => item.details.error?.code === 1004
  );

  const auditEventsService = eventService();

  let journeyAction: JourneyAction | undefined = undefined;
  const anyActionsUnsuccessful = actions.some((obj) => obj.success === false);

  if (isPasskeyCreateJourney) {
    journeyAction = JourneyAction.PASSKEY_CREATE;
  }

  const actionCompletedAuditEventParams: Extensions = {
    account_action: journeyAction,
  };

  const homeAmcAuthorisationReceivedEventParams: Extensions = {
    amc_scope: scope,
    account_action_overall_success: success,
    account_actions: actions.map((obj) => obj.action),
    ...(anyActionsUnsuccessful && {
      account_actions_failed: actions
        .filter((obj) => obj.success === false)
        .map((obj) => obj.action),
      account_actions_errors: actions.map(
        (obj) => obj.details.error?.description
      ),
    }),
  };

  if (success && isPasskeyCreateJourney) {
    const passkeyCreateAction = actions.find(
      (item) => item.action === Action.passkeyCreate
    );
    req.session.createdPasskeyAaguid = passkeyCreateAction?.details?.aaguid;

    actionCompletedAuditEventParams.account_action_overall_success = true;
    sendJourneyOutcomeEvents(
      req,
      res,
      auditEventsService,
      actionCompletedAuditEventParams,
      homeAmcAuthorisationReceivedEventParams
    );
    return res.redirect(PATH_DATA.PASSKEY_CREATED_CONFIRMATION.url);
  } else if (!success && userSignedOut) {
    actionCompletedAuditEventParams.account_action_overall_success = false;
    actionCompletedAuditEventParams.account_action_error = "User logged out";
    sendJourneyOutcomeEvents(
      req,
      res,
      auditEventsService,
      actionCompletedAuditEventParams,
      homeAmcAuthorisationReceivedEventParams
    );
    await handleLogout(req, res, LogoutState.AmcSignedOut);
  } else if (!success && accountHasInterventions) {
    const blockedOrSuspended = accountHasInterventions.details
      .accountInterventionsStatus?.state.blocked
      ? "blocked"
      : "suspended";
    actionCompletedAuditEventParams.account_action_overall_success = false;
    actionCompletedAuditEventParams.account_action_error = `Account has interventions - ${blockedOrSuspended}`;
    sendJourneyOutcomeEvents(
      req,
      res,
      auditEventsService,
      actionCompletedAuditEventParams,
      homeAmcAuthorisationReceivedEventParams
    );
    await handleLogout(
      req,
      res,
      blockedOrSuspended === "blocked"
        ? LogoutState.Blocked
        : LogoutState.Suspended
    );
  } else if (!success && userAbortedJourney) {
    actionCompletedAuditEventParams.account_action_overall_success = false;
    actionCompletedAuditEventParams.account_action_error =
      "User aborted journey";
    sendJourneyOutcomeEvents(
      req,
      res,
      auditEventsService,
      actionCompletedAuditEventParams,
      homeAmcAuthorisationReceivedEventParams
    );
    return res.redirect(
      isPasskeyCreateJourney
        ? PATH_DATA.SIGN_IN_DETAILS.url
        : PATH_DATA.YOUR_SERVICES.url
    );
  } else {
    actionCompletedAuditEventParams.account_action_overall_success = false;
    actionCompletedAuditEventParams.account_action_error = "Unknown error";
    sendJourneyOutcomeEvents(
      req,
      res,
      auditEventsService,
      actionCompletedAuditEventParams,
      homeAmcAuthorisationReceivedEventParams
    );
    req.metrics?.addMetric("UnrecognisedJourneyOutcome", MetricUnit.Count, 1);
    req.log.error(`UnrecognisedJourneyOutcome with outcome_id ${outcome_id}`);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    res.render("common/errors/500.njk");
  }
}

function sendJourneyOutcomeEvents(
  req: Request,
  res: Response,
  service: EventServiceInterface,
  actionCompletedAuditEventParams: Extensions,
  amcAuthReceivedEventParams: Extensions
): void {
  const homeActionEvent = service.buildAuditEvent(
    req,
    res,
    EventName.HOME_ACTION_COMPLETED,
    actionCompletedAuditEventParams
  );
  service.send(homeActionEvent, res.locals.trace);

  const homeAmcAuthorisationReceivedEvent = service.buildAuditEvent(
    req,
    res,
    EventName.HOME_AMC_AUTHORISATION_RECEIVED,
    amcAuthReceivedEventParams
  );

  service.send(homeAmcAuthorisationReceivedEvent, res.locals.trace);
}
