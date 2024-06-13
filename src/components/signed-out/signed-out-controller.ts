import { Request, Response } from "express";
import { PATH_DATA } from "../../app.constants.js";

export function signedOutGet(_req: Request, res: Response): void {
  res.status(401);
  res.render("signed-out/index.njk", {
    signinLink: PATH_DATA.START.url,
    hideAccountNavigation: true,
  });
}
