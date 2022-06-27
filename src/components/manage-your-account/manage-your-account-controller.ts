import { Request, Response } from "express";
import { redactPhoneNumber } from "../../utils/strings";

export function manageYourAccountGet(req: Request, res: Response): void {
  const data = {
    email: req.session.user.email,
    xphoneNumber: redactPhoneNumber(req.session.user.phoneNumber),
  };

  res.render("manage-your-account/index.njk", data);
}
