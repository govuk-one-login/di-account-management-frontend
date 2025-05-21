import type { Request, Response } from "express";

export function permanentlySuspendedGet(req: Request, res: Response): void {
  res.status(401);
  res.render("permanently-suspended/index.njk");
}
