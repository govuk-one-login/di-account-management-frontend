import { Request, Response } from "express";

export function manageYourAccountGet(req: Request, res: Response): void {
  const data = {
    email: req.session.user.email,
    phoneNumber: req.session.user.phone,
  };

  res.render("manage-your-account/index.njk", data);
}
