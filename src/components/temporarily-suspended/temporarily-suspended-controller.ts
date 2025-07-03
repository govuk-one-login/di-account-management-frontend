import type { Request, Response } from "express";

export function temporarilySuspendedGet(req: Request, res: Response): void {
  res.status(401);
  res.render("temporarily-suspended/index.njk");
}
