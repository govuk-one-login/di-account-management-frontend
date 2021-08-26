import { Request, Response } from "express";

export function manageYourAccountGet(req: Request, res: Response): void {

  // TODO: read data from session when available
  // const data = {
  //   email: req.session.user.email,
  //   phoneNumber: req.session.user.phone,
  // };

  const data = {
    email: "joe.bloggs",
    phoneNumber: "0123456789",
  };
  res.render("manage-your-account/index.njk", data);
}
