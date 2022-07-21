import { Request, Response } from "express";
import { redactPhoneNumber } from "../../utils/strings";
import { getManageGovukEmailsUrl } from "../../config";

export function manageYourAccountGet(req: Request, res: Response): void {
  const data = {
    email: req.session.user.email,
    phoneNumber: redactPhoneNumber(req.session.user.phoneNumber),
    manageEmailsLink: getManageGovukEmailsUrl()
  };

  res.render("manage-your-account/index.njk", data);
}
