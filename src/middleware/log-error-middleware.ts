import { NextFunction, Request, Response } from "express";
import { shouldLogError } from "../utils/shouldLogError";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

export function logErrorMiddleware(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  req.metrics?.addMetric("logErrorMiddleware", MetricUnit.Count, 1);

  if (shouldLogError(error)) {
    req.metrics?.addMetric(
      "logErrorMiddlewareErrorLogged",
      MetricUnit.Count,
      1
    );

    req.log.error(error, error?.message);
  }
  next(error);
}
