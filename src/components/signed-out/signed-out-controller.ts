import { Request, Response } from "express";
import { PATH_DATA } from "../../app.constants";

export function signedOutGet(_req: Request, res: Response): void {
  res.status(401);
  const redirectUri = _req.query.end_session_redirect_uri as string;
  if (redirectUri) {
    return res.redirect(redirectUri);
  }
  res.render("signed-out/index.njk", {
    signinLink: PATH_DATA.START.url,
    hideAccountNavigation: true,
  });
}
