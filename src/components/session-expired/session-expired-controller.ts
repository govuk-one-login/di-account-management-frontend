import { Request, Response } from "express";

export function sessionExpiredGet(req: Request, res: Response): void {
  res.status(401);
  res.render("session-expired/index.njk", { hideSignoutLink: true });
}
