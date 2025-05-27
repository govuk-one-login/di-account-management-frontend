import { Request, Response } from "express";
import { clearCookies, destroyUserSessions } from "./session-store";
import { getBaseUrl } from "../config";
import { LogoutState, LogoutStateType, PATH_DATA } from "../app.constants";
import { EndSessionParameters } from "openid-client";

export async function handleLogout(
  req: Request,
  res: Response,
  state: LogoutStateType
): Promise<void> {
  const { idToken } = req.session.user.tokens;
  const { subjectId } = req.session.user;
  await destroyUserSessions(req, subjectId, req.app.locals.sessionStore);

  if (state === LogoutState.AccountDeletion) {
    clearCookies(req, res, ["am"]);
  } else {
    res.cookie("lo", "true");
  }

  const endSessionParams: EndSessionParameters = {
    id_token_hint: idToken,
    post_logout_redirect_uri: `${getBaseUrl()}${PATH_DATA.LOGOUT_REDIRECT.url}`,
    state: state,
  };

  const redirectUrl = req.oidc.endSessionUrl(endSessionParams);
  res.redirect(redirectUrl);
}
