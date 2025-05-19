import type { Request, Response } from "express";

export function temporarilyBlockedGet(req: Request, res: Response): void {
  res.status(401);
  res.render("temporarily-blocked/index.njk");
}
