import { NextFunction, Request, Response } from "express";
import { Metrics, MetricUnit } from "@aws-lambda-powertools/metrics";
import { logError, logger } from "../utils/logger";

export function metricsMiddleware(
  namespace = "Account Home",
  serviceName = "Frontend"
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const metrics = new Metrics({
      namespace,
      serviceName,
    });

    req.metrics = metrics;

    res.on("finish", async () => {
      const statusCode = res.statusCode;
      metrics.addMetric(`HttpStatus_${statusCode}`, MetricUnit.Count, 1);

      try {
        metrics.publishStoredMetrics();
      } catch (error) {
        logError(logger, "Failed to publish metric", error);
      }
    });

    next();
  };
}
