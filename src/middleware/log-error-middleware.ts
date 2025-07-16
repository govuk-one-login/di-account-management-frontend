import { NextFunction, Request, Response } from "express";
import { shouldLogError } from "../utils/shouldLogError";

export function logErrorMiddleware(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (shouldLogError(error)) {
    req.log.error(error, error?.message);
  }
  next(error);
}
