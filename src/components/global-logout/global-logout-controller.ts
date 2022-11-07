import { Request, Response } from "express";
import { HTTP_STATUS_CODES } from "../../app.constants";
import { LogoutToken } from "./types";
import { jwtVerify } from "jose";
import {
  getLogoutTokenMaxAge,
  getTokenValidationClockSkew,
} from "../../config";

const BACK_CHANNEL_LOGOUT_EVENT =
  "http://schemas.openid.net/event/backchannel-logout";

async function verifyLogoutToken(req: Request): Promise<LogoutToken> {
  if (!(req.body && Object.keys(req.body).includes("logout_token"))) {
    return undefined;
  }
  try {
    const token = await jwtVerify(req.body.logout_token, req.issuerJWKS, {
      issuer: req.oidc.issuer.metadata.issuer,
      audience: req.oidc.metadata.client_id,
      maxTokenAge: getLogoutTokenMaxAge(),
      clockTolerance: getTokenValidationClockSkew(),
    });

    return token.payload as LogoutToken;
  } catch (e) {
    req.log.error(
      new Error(`Unable to validate logout_token. Error: ${e.message}`)
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
  const token = await verifyLogoutToken(req);

  if (token && validateLogoutTokenClaims(token, req)) {
    req.app.locals.subjectSessionIndexService
      .getSessions(token.sub)
      .forEach((sessionId: string) => {
        req.app.locals.sessionStore.destroy(sessionId);
        req.app.locals.subjectSessionIndexService.removeSession(
          token.sub,
          sessionId
        );
      });
    res.cookie("lo", "true");
    res.send(HTTP_STATUS_CODES.OK);
    return;
  }
  res.send(HTTP_STATUS_CODES.UNAUTHORIZED);
}
