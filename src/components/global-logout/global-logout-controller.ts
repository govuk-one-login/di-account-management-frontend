import { Request, Response } from "express";

export function globalLogoutGet(req: Request, res: Response): void {
  res.render("global-logout/index.njk", {});
}
