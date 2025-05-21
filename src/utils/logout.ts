import { Request, Response } from "express";
import { destroyUserSessions } from "./session-store";
import { getBaseUrl } from "../config";

export async function handleLogout(
  req: Request,
  res: Response,
  post_logout_redirect_uri?: string
): Promise<void> {
  const idToken = req.session.user.tokens.idToken;
  await destroyUserSessions(
    req,
    req.session.user.subjectId,
    req.app.locals.sessionStore
  );
  res.cookie("lo", "true");

  const endSessionParams: any = { id_token_hint: idToken };
  if (post_logout_redirect_uri) {
    endSessionParams.post_logout_redirect_uri = `${getBaseUrl()}${post_logout_redirect_uri}}`;
  }

  const redirectUrl = req.oidc.endSessionUrl(endSessionParams);
  res.redirect(redirectUrl);
}
