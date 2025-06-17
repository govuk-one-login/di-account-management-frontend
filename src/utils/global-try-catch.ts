import { NextFunction, Response, Request } from "express";
import { logger } from "./logger";
import { StandardUnit } from "@aws-sdk/client-cloudwatch";
import { sendCustomMetric } from "./cloudwatch-metrics";

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
      sendCustomMetric({
        metricName: "globalTryCatchAsyncError",
        unit: StandardUnit.Count,
        value: 1,
      });
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
      sendCustomMetric({
        metricName: "globalTryCatchError",
        unit: StandardUnit.Count,
        value: 1,
      });
      logger.error(`Global try catch: failed with the error ${error}`);
      next?.(error);
    }
  };
};
