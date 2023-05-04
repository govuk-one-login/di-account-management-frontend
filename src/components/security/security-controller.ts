import { Request, Response } from "express";
import { getManageGovukEmailsUrl } from "../../config";

export function securityGet(req: Request, res: Response): void {
  const data = {
    email: req.session.user.email,
    phoneNumber: req.session.user.phoneNumber.slice(-4),
    isPhoneNumberVerified: req.session.user.isPhoneNumberVerified,
    manageEmailsLink: getManageGovukEmailsUrl(),
  };

  res.render("security/index.njk", data);
}
