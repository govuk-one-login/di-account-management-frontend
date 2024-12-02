import { NextFunction, Response, Request } from "express";
import { logger } from "./logger";

export const globalTryCatch = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (error) {
      logger.error(error);
      next(error);
    }
  };
};
