import { Request, Response } from "express";
import { supportActivityLog } from "../../config";
import { PATH_DATA } from "../../app.constants";

export function securityGet(req: Request, res: Response): void {
  const data = {
    email: req.session.user.email,
    phoneNumber:
      req.session.user.phoneNumber && req.session.user.phoneNumber.slice(-4),
    isPhoneNumberVerified: req.session.user.isPhoneNumberVerified,
    supportActivityLog: supportActivityLog(),
    activityLogUrl: PATH_DATA.SIGN_IN_HISTORY.url
  };

  res.render("security/index.njk", data);
}
