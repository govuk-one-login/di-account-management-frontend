import { Request, Response } from "express";
import { PATH_DATA } from "../../app.constants";

export function securityCodeInvalidGet(req: Request, res: Response): void {
  res.render("security-code-error/index.njk", {
    newCodeLink: PATH_DATA.REQUEST_NEW_CODE_OTP.url,
  });
}
