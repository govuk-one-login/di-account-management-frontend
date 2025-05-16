import type { Request, Response } from "express";

export function permanentlyBlockedGet(req: Request, res: Response): void {
  res.status(401);
  res.render("permanently-blocked/index.njk");
}
