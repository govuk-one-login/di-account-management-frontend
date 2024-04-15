import { Request, Response } from "express";
import { PATH_DATA } from "../../app.constants";

export function signedOutGet(req: Request, res: Response): void {
  res.status(401);
  res.render("signed-out/index.njk", {
    signinLink: PATH_DATA.START.url,
    hideAccountNavigation: true,
    language: req.language,
    currentUrl: req.originalUrl,
    baseUrl: req.protocol + "://" + req.hostname,
  });
}
