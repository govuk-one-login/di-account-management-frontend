import { Request, Response } from "express";
import { HTTP_STATUS_CODES } from "../../app.constants";
import { LogoutToken } from "./types";
import { jwtVerify } from "jose";
import {
  getLogoutTokenMaxAge,
  getTokenValidationClockSkew,
} from "../../config";
import { destroyUserSessions } from "../../utils/session-store";
import { getOIDCConfig } from "../../config/oidc";
import { getCachedJWKS } from "../../utils/oidc";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

const BACK_CHANNEL_LOGOUT_EVENT =
  "http://schemas.openid.net/event/backchannel-logout";
const oidcConfig = getOIDCConfig();

async function verifyLogoutToken(req: Request): Promise<LogoutToken> {
  if (!(req.body && Object.keys(req.body).includes("logout_token"))) {
    return undefined;
  }
  try {
    req.issuerJWKS = await getCachedJWKS(oidcConfig);

    const token = await jwtVerify(req.body.logout_token, req.issuerJWKS, {
      issuer: req.oidc.issuer.metadata.issuer,
      audience: req.oidc.metadata.client_id,
      maxTokenAge: getLogoutTokenMaxAge(),
      clockTolerance: getTokenValidationClockSkew(),
    });

    return token.payload as LogoutToken;
  } catch (error) {
    req.log.error(
      new Error(`Unable to validate logout_token. Error: ${error.message}`)
    );
    return undefined;
  }
}

function validateLogoutTokenClaims(token: LogoutToken, req: Request): boolean {
  if (!token.sub || /^\s*$/.test(token.sub)) {
    req.log.error(new Error(`Logout token does not contain a subject`));
    return false;
  }
  if (!token.events) {
    req.log.error(new Error(`Logout token does not contain any event`));
    return false;
  }
  if (!(BACK_CHANNEL_LOGOUT_EVENT in token.events)) {
    req.log.error(
      new Error(`Logout token does not contain correct event: ${token.events}`)
    );
    return false;
  }
  if (Object.keys(token.events[BACK_CHANNEL_LOGOUT_EVENT]).length > 0) {
    req.log.error(
      new Error(
        `Logout token back-channel logout event is not an empty object: ${token.events[BACK_CHANNEL_LOGOUT_EVENT]}`
      )
    );
    return false;
  }
  return true;
}

export async function globalLogoutPost(
  req: Request,
  res: Response
): Promise<void> {
  req.metrics?.addMetric("globalLogoutPost", MetricUnit.Count, 1);
  const token = await verifyLogoutToken(req);

  if (token && validateLogoutTokenClaims(token, req)) {
    await destroyUserSessions(req, token.sub, req.app.locals.sessionStore);
    res.send(HTTP_STATUS_CODES.OK);
    return;
  }
  res.send(HTTP_STATUS_CODES.UNAUTHORIZED);
}
