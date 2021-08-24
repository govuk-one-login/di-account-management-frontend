import { NextFunction, Request, Response } from "express";

export function initialiseSessionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  req.session.user = {};
  next();
}
