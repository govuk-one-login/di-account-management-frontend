import { Request, Response } from "express";
import { PATH_DATA } from "../../app.constants";

export function signedOutGet(req: Request, res: Response): void {
  res.status(200);
  res.render("signed-out/index.njk", {
    signinLink: PATH_DATA.START.url,
    hideAccountNavigation: true,
  });
}
