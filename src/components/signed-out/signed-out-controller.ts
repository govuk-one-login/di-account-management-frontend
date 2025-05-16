import { Request, Response } from "express";
import { PATH_DATA } from "../../app.constants";

export function signedOutGet(req: Request, res: Response): void {
  res.status(401);

  const redirectUri = req.query?.post_logout_redirect_uri;
  if (typeof redirectUri === "string" && redirectUri.length > 0) {
    res.redirect(redirectUri);
    return;
  }

  res.render("signed-out/index.njk", {
    signinLink: PATH_DATA.START.url,
    hideAccountNavigation: true,
  });
}
