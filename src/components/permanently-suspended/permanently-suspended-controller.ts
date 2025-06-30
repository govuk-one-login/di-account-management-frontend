import type { Request, Response } from "express";
import { supportSearchableList } from "../../config";

export function permanentlySuspendedGet(req: Request, res: Response): void {
  res.status(401);
  res.render("permanently-suspended/index.njk", {
    searchableListEnabled: supportSearchableList(),
  });
}
