import { NextFunction, Request, Response } from "express";
import { Metrics, MetricUnit } from "@aws-lambda-powertools/metrics";
import { logger } from "../utils/logger";
import { performance } from "perf_hooks";

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
      const utilizationPercent =
        performance.eventLoopUtilization().utilization * 100;
      metrics.addMetric(
        "EventLoopUtilization",
        MetricUnit.Percent,
        utilizationPercent
      );

      try {
        metrics.publishStoredMetrics();
      } catch (error) {
        logger.error("Failed to publish metric", error);
      }
    });

    next();
  };
}
