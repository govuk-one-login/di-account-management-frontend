import { NextFunction, Request, Response } from "express";
import { passkeysEnabled } from "../config.js";

export const blockPasskeyRoutesIfNotEnabled = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (passkeysEnabled(req)) {
    next();
    return;
  }
  res.status(404);
  res.send();
};
