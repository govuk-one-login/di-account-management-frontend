import { Request, Response, NextFunction } from "express";
import { PATH_DATA } from "../../app.constants";

export function addMfaMethodGet(req: Request, res: Response): void {
  res.render(`add-mfa-method/index.njk`);
}

export function addMfaMethodPost(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { addMfaMethod } = req.body;

  if (addMfaMethod === "sms") {
    res.status(400);
    res.end();
    return;
  }

  if (addMfaMethod === "app") {
    res.redirect(PATH_DATA.ADD_MFA_METHOD_APP.url);
    return;
  }

  req.log.error(`unknown addMfaMethod: ${addMfaMethod}`);
  return next(new Error(`Unknown addMfaMethod: ${addMfaMethod}`));
}
