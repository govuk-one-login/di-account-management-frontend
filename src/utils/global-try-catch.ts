import { NextFunction, Response, Request } from "express";
import { logger } from "./logger";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

export const globalTryCatchAsync = (
  fn: (req: Request, res: Response, next?: NextFunction) => Promise<void>
) => {
  return async (
    req: Request,
    res: Response,
    next?: NextFunction
  ): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (error) {
      req.metrics?.addMetric("globalTryCatchAsyncError", MetricUnit.Count, 1);
      logger.error(`Global try catch Async: failed with the error ${error}`);
      next?.(error);
    }
  };
};

export const globalTryCatch = (
  fn: (req: Request, res: Response, next?: NextFunction) => void
) => {
  return (req: Request, res: Response, next?: NextFunction): void => {
    try {
      fn(req, res, next);
    } catch (error) {
      req.metrics?.addMetric("globalTryCatchError", MetricUnit.Count, 1);
      logger.error(`Global try catch: failed with the error ${error}`);
      next?.(error);
    }
  };
};
