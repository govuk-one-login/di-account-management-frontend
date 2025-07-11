import { NextFunction, Request, Response } from "express";
import { generators } from "openid-client";
import { PATH_DATA, VECTORS_OF_TRUST } from "../app.constants";
import { logger } from "../utils/logger";

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

async function redirectToLogIn(req: Request, res: Response): Promise<void> {
  req.session.nonce = generators.nonce(15);
  req.session.state = generators.nonce(10);
  req.session.currentURL = req.url;
  const authUrl = req.oidc.authorizationUrl({
    client_id: req.oidc.metadata.client_id,
    response_type: "code",
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    scope: req.oidc.metadata.scopes,
    state: req.session.state,
    nonce: req.session.nonce,
    redirect_uri: req.oidc.metadata.redirect_uris[0],
    cookie_consent: req.query.cookie_consent,
    vtr: JSON.stringify([VECTORS_OF_TRUST.MEDIUM]),
    _ga: req.query._ga,
  });
  return res.redirect(authUrl);
}
