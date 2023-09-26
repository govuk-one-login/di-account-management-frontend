import { Request, Response } from "express";

export function contactGet(req: Request, res: Response): void {
  const data = {};

  res.render("contact-govuk-one-login/index.njk", data);
}
