import { Request, Response } from "express";
import { HTTP_STATUS_CODES } from "../../app.constants";
import { GlobalLogoutServiceInterface, LogoutToken } from "./types";
import {
  getLogoutTokenMaxAge,
  getTokenValidationClockSkew,
} from "../../config";
import { ExpressRouteFunc } from "../../types";
import { globalLogoutService } from "./global-logout-service";
const jose = require("jose");

const backChannelLogoutEvent =
  "http://schemas.openid.net/event/backchannel-logout";

const verifyLogoutToken = async (req: Request): Promise<LogoutToken> => {
  if (!(req.body && Object.keys(req.body).includes("logout_token"))) {
    return undefined;
  }
  try {
    const token = await jose.jwtVerify(req.body.logout_token, req.issuerJWKS, {
      issuer: req.oidc.issuer.metadata.issuer,
      audience: req.oidc.metadata.client_id,
      maxTokenAge: getLogoutTokenMaxAge(),
      clockTolerance: getTokenValidationClockSkew(),
    });

    return token.payload;
  } catch (e) {
    req.log.error(
      new Error(`Unable to validate logout_token. Error: ${e.message}`)
    );
    return undefined;
  }
};

const validateLogoutTokenClaims = (
  token: LogoutToken,
  req: Request
): boolean => {
  if (!token.sub || /^\s*$/.test(token.sub)) {
    req.log.error(new Error(`Logout token does not contain a subject`));
    return false;
  }
  if (!token.events) {
    req.log.error(new Error(`Logout token does not contain any event`));
    return false;
  }
  if (!(backChannelLogoutEvent in token.events)) {
    req.log.error(
      new Error(`Logout token does not contain correct event: ${token.events}`)
    );
    return false;
  }
  if (Object.keys(token.events[backChannelLogoutEvent]).length > 0) {
    req.log.error(
      new Error(
        `Logout token back-channel logout event is not an empty object: ${token.events[backChannelLogoutEvent]}`
      )
    );
    return false;
  }
  return true;
};

export function globalLogoutPost(
  service: GlobalLogoutServiceInterface = globalLogoutService()
): ExpressRouteFunc {
  return async (req: Request, res: Response) => {
    const token = await verifyLogoutToken(req);

    if (token && validateLogoutTokenClaims(token, req)) {
      await service.clearSessionForSubject(token.sub);
      res.send(HTTP_STATUS_CODES.OK);
      return;
    }
    res.send(HTTP_STATUS_CODES.UNAUTHORIZED);
  };
}
