import { NextFunction, Request, Response } from "express";
import { Metrics } from "@aws-lambda-powertools/metrics";
import { logger } from "../utils/logger";

declare module "express-serve-static-core" {
  interface Request {
    metrics?: Metrics;
  }
}

export function metricsMiddleware(namespace = "amf", serviceName = "frontend") {
  return (req: Request, res: Response, next: NextFunction) => {
    const metrics = new Metrics({
      namespace,
      serviceName,
    });

    req.metrics = metrics;

    res.on("finish", async () => {
      try {
        metrics.publishStoredMetrics();
      } catch (error) {
        logger.error("Failed to publish metric", error);
      }
    });

    next();
  };
}
