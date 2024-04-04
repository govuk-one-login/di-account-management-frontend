import { Request, Response } from "express";

export function addMfaMethodGet(req: Request, res: Response): void {
  res.render(`add-mfa-method/index.njk`);
}
