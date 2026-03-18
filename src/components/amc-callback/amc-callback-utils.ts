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
} from "../../app.constants.js";
import { http } from "../../utils/http.js";
import { randomUUID } from "node:crypto";
import * as jose from "jose";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

enum Scope {
  testingJourney = "testing-journey",
  accountDelete = "account-delete",
  passkeyCreate = "passkey-create",
}

interface JourneyOutcome {
  outcome_id: string;
  sub: string;
  email: string;
  scope: Scope;
  success: boolean;
  journeys: {
    journey: Scope;
    timestamp: number;
    success: boolean;
    details: {
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
    alg: "RS256",
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
  const { scope, journeys, outcome_id } = outcome;
  const currentJourney = journeys.find((item) => item.journey === scope);
  const error = currentJourney?.details?.error;
  const success = currentJourney?.success;
  const isPasskeyJourney = scope === Scope.passkeyCreate;

  if (success && isPasskeyJourney) {
    return res.redirect("/todo-passkey-confirmation");
  } else if (!success && error?.code === 1001) {
    await handleLogout(req, res, LogoutState.AmcSignedOut);
  } else if (!success && isPasskeyJourney && error?.code === 1002) {
    return res.redirect("/todo-user-aborted");
  } else {
    req.metrics?.addMetric("UnrecognisedJourneyOutcome", MetricUnit.Count, 1);
    req.log.error(`UnrecognisedJourneyOutcome with outcome_id ${outcome_id}`);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    res.render("common/errors/500.njk");
  }
}
