import { NextFunction, Request, Response } from "express";
import { Metrics, MetricUnit } from "@aws-lambda-powertools/metrics";
import { logger } from "../utils/logger.js";

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
        logger.error(error, "Failed to publish metric");
      }
    });

    next();
  };
}
