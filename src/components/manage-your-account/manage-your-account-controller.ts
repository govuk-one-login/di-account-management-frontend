import { Request, Response } from "express";
import { getYourAccountUrl } from "../../config";
import { redactPhoneNumber } from "../../utils/strings";

export function manageYourAccountGet(req: Request, res: Response): void {
  const data = {
    email: req.session.user.email,
    phoneNumber: redactPhoneNumber(req.session.user.phoneNumber),
    yourAccountUrl: getYourAccountUrl(),
  };

  res.render("manage-your-account/index.njk", data);
}
