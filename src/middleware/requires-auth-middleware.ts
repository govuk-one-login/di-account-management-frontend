import { NextFunction, Request, Response } from "express";
import { generators } from "openid-client";
import { PATH_DATA, VECTORS_OF_TRUST } from "../app.constants";
import { logger } from "../utils/logger";
import { kmsService } from "../utils/kms";
import base64url from "base64url";
import { getApiBaseUrl, enableJarAuth } from "../config";

export async function requiresAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const isAuthenticated = req.session.user?.isAuthenticated;
  const isLoggedOut = req.cookies?.lo;

  logger.info(
    { trace: res.locals.trace },
    `isAuthenticated = ${isAuthenticated} , isLoggedOut = ${isLoggedOut}`
  );
  // if there is no session, then should create a session and redirect to auth to sign in
  if (isAuthenticated === undefined) {
    req.session.currentURL = req.url;
    await redirectToLogIn(req, res);
  } else if (!isAuthenticated && isLoggedOut == "true") {
    return res.redirect(PATH_DATA.USER_SIGNED_OUT.url);
  } else if (!isAuthenticated) {
    return res.redirect(PATH_DATA.SESSION_EXPIRED.url);
  } else {
    res.locals.isUserLoggedIn = true;
    res.cookie("lo", "false");
    next();
  }
}

export async function redirectToLogIn(req: Request, res: Response): Promise<void> {
  req.session.nonce = generators.nonce(15);
  req.session.state = generators.nonce(10);
  const authorizationUrl = await generateAuthUrl(enableJarAuth(), req);

  return res.redirect(authorizationUrl);
}

async function generateAuthUrl(includeToken: boolean, req: Request): Promise<string> {
  const baseParams = {
    client_id: req.oidc.metadata.client_id,
    response_type: "code",
    scope: req.oidc.metadata.scopes as string,
  };

  if (includeToken) {
    const headers = { alg: "RS512", typ: "JWT" };
    const claims = {
      aud: `${ getApiBaseUrl() }/authorize`,
      iss: req.oidc.metadata.client_id,
      ...baseParams,
      redirect_uri: req.oidc.metadata.redirect_uris[0],
      state: req.session.state,
      nonce: req.session.nonce,
      vtr: JSON.stringify([VECTORS_OF_TRUST.MEDIUM]),
      cookie_consent: req.query.cookie_consent,
      _ga: req.query._ga  
    }
    const encodedHeader = base64url.encode(JSON.stringify(headers));
    const encodedPayload = base64url.encode(JSON.stringify(claims));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`
    const sig = await kmsService.sign(unsignedToken)
    const base64Signature = Buffer.from(sig.Signature)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    return req.oidc.authorizationUrl({
      ...baseParams,
      request: `${unsignedToken}.${base64Signature}`,
    });
  } else {
    return req.oidc.authorizationUrl({
      ...baseParams,
      state: req.session.state,
      nonce: req.session.nonce,
      redirect_uri: req.oidc.metadata.redirect_uris[0],
      cookie_consent: req.query.cookie_consent,
      vtr: JSON.stringify([VECTORS_OF_TRUST.MEDIUM]),
      _ga: req.query._ga,
    });
  }
}