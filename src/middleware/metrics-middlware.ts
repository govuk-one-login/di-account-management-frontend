import { NextFunction, Request, Response } from "express";
import {
  PutMetricDataCommand,
  StandardUnit,
  MetricDatum,
  CloudWatchClient,
} from "@aws-sdk/client-cloudwatch";
import { logger } from "../utils/logger";

export const cloudWatchClient = new CloudWatchClient({});

interface Metric {
  MetricName: string;
  Dimensions?: { Name: string; Value: string }[];
  Unit: StandardUnit;
  Value: number;
  Timestamp?: Date;
}

declare module "express-serve-static-core" {
  interface Request {
    metrics?: {
      addMetric: (
        name: string,
        unit: StandardUnit,
        value: number,
        dimensions?: { Name: string; Value: string }[],
        timestamp?: Date
      ) => void;
    };
  }
}

export function metricsMiddleware(
  namespace = "Account Home",
  serviceName = "Frontend"
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const customMetrics: Metric[] = [];
    req.metrics = {
      addMetric: (
        name: string,
        unit: StandardUnit,
        value: number,
        dimensions?: { Name: string; Value: string }[],
        timestamp?: Date
      ) => {
        customMetrics.push({
          MetricName: name,
          Unit: unit,
          Value: value,
          Dimensions: [
            ...(dimensions || []),
            { Name: "ServiceName", Value: serviceName },
          ],
          Timestamp: timestamp || new Date(),
        });
      },
    };

    res.on("finish", () => {
      req.metrics?.addMetric(
        `HttpStatus_${res.statusCode}`,
        StandardUnit.Count,
        1
      );
      for (let i = 0; i < customMetrics.length; i += 20) {
        const batch = customMetrics.slice(i, i + 20);
        const params = {
          Namespace: namespace,
          MetricData: batch as MetricDatum[],
        };
        try {
          cloudWatchClient.send(new PutMetricDataCommand(params));
        } catch (error) {
          logger.error("Failed to publish metric batch", error);
        }
      }
    });
    next();
  };
}
