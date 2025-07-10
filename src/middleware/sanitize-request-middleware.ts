import { NextFunction, Request, Response } from "express";

export function sanitizeRequestMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  next();
}
