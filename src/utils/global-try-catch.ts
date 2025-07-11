import { NextFunction, Response, Request, RequestHandler } from "express";
import { logger } from "./logger";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

export function globalTryCatchAsync(
  fn: RequestHandler
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return function (req: Request, res: Response, next: NextFunction) {
    return Promise.resolve(fn(req, res, next)).catch((error) => {
      req.metrics?.addMetric("globalTryCatchAsyncError", MetricUnit.Count, 1);
      logger.error("Global async error handler:", error);
      next?.(error);
    });
  };
}

export const globalTryCatch = (
  fn: (req: Request, res: Response, next?: NextFunction) => void
) => {
  return (req: Request, res: Response, next?: NextFunction): void => {
    try {
      fn(req, res, next);
    } catch (error) {
      req.metrics?.addMetric("globalTryCatchError", MetricUnit.Count, 1);
      logger.error("Global error handler:", error);
      next?.(error);
    }
  };
};
