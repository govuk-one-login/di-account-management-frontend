import { NextFunction, Request, Response } from "express";
import { passkeysEnabled } from "../config.js";
import { mfaMethodMiddleware } from "./mfa-method-middleware.js";

export const blockPasskeyRoutesIfNotEnabled = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!passkeysEnabled(req)) {
    await mfaMethodMiddleware(req, res, next);
  } else {
    next();
  }
};
