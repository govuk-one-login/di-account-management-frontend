import { Request, Response } from "express";

export function manageYourAccountGet(req: Request, res: Response): void {
  const data = {
    email:"email@email.com",
    phoneNumber:"*******0457"
  }
  res.render("manage-your-account/index.njk", data);
}
