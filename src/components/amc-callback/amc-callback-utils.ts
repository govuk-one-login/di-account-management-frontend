import { kmsService } from "../../utils/kms.js";
import { ParsedQs } from "qs";
import { AxiosRequestConfig } from "axios";
import {
  getAmcTokenUrl,
  getAmcJourneyOutcomeUrl,
  getAmcClientId,
  getHomeBaseUrl,
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
    timestamp: number;
    success: boolean;
    details: {
      aaguid?: string;
      error?: {
        code: number;
        description: string;
      };
    };
  }[];
}

export type ValidQueryStringParams =
  | { state: string; code: string; error?: never; error_description?: never }
  | { state: string; error: string; error_description: string; code?: never };

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
  const hasError =
    typeof query.error === "string" &&
    typeof query.error_description === "string";

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
    redirect_uri: `${getHomeBaseUrl()}${PATH_DATA.AMC_CALLBACK.url}`,
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
  const passkeyCreateAction = actions.find(
    (item) => item.action === Action.passkeyCreate
  );
  const isPasskeyCreateJourney = scope === Scope.passkeyCreate;
  const passkeyCreateUserAbortedJourney =
    passkeyCreateAction?.details?.error?.code === 1002;
  const userSignedOut = actions.find(
    (item) => item.details.error?.code === 1001
  );

  req.session.createdPasskeyAaguid = passkeyCreateAction?.details?.aaguid;

  const service = eventService();

  let journeyAction: JourneyAction | undefined = undefined;

  if (isPasskeyCreateJourney) {
    journeyAction = JourneyAction.PASSKEY_CREATE;
  }

  if (success && isPasskeyCreateJourney) {
    const auditEvent = service.buildAuditEvent(
      req,
      res,
      EventName.HOME_ACTION_COMPLETED,
      {
        account_action: JourneyAction.PASSKEY_CREATE,
        account_action_overall_outcome: true,
      }
    );
    void service.send(auditEvent, res.locals.trace);

    return res.redirect(PATH_DATA.PASSKEY_CREATED_CONFIRMATION.url);
  } else if (!success && userSignedOut) {
    const auditEvent = service.buildAuditEvent(
      req,
      res,
      EventName.HOME_ACTION_COMPLETED,
      {
        account_action: journeyAction,
        account_action_overall_outcome: false,
        account_action_error: "User logged out",
      }
    );
    void service.send(auditEvent, res.locals.trace);

    await handleLogout(req, res, LogoutState.AmcSignedOut);
  } else if (
    !success &&
    isPasskeyCreateJourney &&
    passkeyCreateUserAbortedJourney
  ) {
    const auditEvent = service.buildAuditEvent(
      req,
      res,
      EventName.HOME_ACTION_COMPLETED,
      {
        account_action: JourneyAction.PASSKEY_CREATE,
        account_action_overall_outcome: false,
        account_action_error: "User aborted journey",
      }
    );
    void service.send(auditEvent, res.locals.trace);

    return res.redirect(PATH_DATA.SIGN_IN_DETAILS.url);
  } else {
    const auditEvent = service.buildAuditEvent(
      req,
      res,
      EventName.HOME_ACTION_COMPLETED,
      {
        account_action: journeyAction,
        account_action_overall_outcome: false,
        account_action_error: "Unknown error",
      }
    );
    void service.send(auditEvent, res.locals.trace);

    req.metrics?.addMetric("UnrecognisedJourneyOutcome", MetricUnit.Count, 1);
    req.log.error(`UnrecognisedJourneyOutcome with outcome_id ${outcome_id}`);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    res.render("common/errors/500.njk");
  }
}
