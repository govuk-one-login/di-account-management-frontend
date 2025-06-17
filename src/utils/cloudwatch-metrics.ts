import {
  PutMetricDataCommand,
  StandardUnit,
  MetricDatum,
  CloudWatchClient,
} from "@aws-sdk/client-cloudwatch";
import { AwsConfig, getAWSConfig } from "../config/aws";
import { logger } from "./logger";

const awsConfig: AwsConfig = getAWSConfig();
export const cloudWatchClient = new CloudWatchClient(awsConfig as any);

const METRIC_BATCH_SIZE = 20;
const METRIC_FLUSH_INTERVAL_MS = 5000;
const metricQueue: MetricDatum[] = [];
let flushTimer: NodeJS.Timeout | null = null;

function flushMetrics(namespace: string) {
  if (metricQueue.length === 0) return;
  const batch = metricQueue.splice(0, METRIC_BATCH_SIZE);
  cloudWatchClient
    .send(
      new PutMetricDataCommand({
        Namespace: namespace,
        MetricData: batch,
      })
    )
    .catch((err) => {
      logger.error("Failed to send batched CloudWatch metrics", err);
    });
}

function scheduleFlush(namespace: string) {
  if (!flushTimer) {
    flushTimer = setInterval(() => {
      flushMetrics(namespace);
      if (metricQueue.length === 0) {
        clearInterval(flushTimer!);
        flushTimer = null;
      }
    }, METRIC_FLUSH_INTERVAL_MS);
  }
}

export function sendCustomMetric({
  metricName,
  unit,
  value,
  dimensions = [],
  timestamp = new Date(),
  namespace = "Account Home",
}: {
  metricName: string;
  unit: StandardUnit;
  value: number;
  dimensions?: { Name: string; Value: string }[];
  timestamp?: Date;
  namespace?: string;
}): void {
  const metric: MetricDatum = {
    MetricName: metricName,
    Unit: unit,
    Value: value,
    Dimensions: dimensions,
    Timestamp: timestamp,
  };
  metricQueue.push(metric);
  if (metricQueue.length >= METRIC_BATCH_SIZE) {
    flushMetrics(namespace);
  } else {
    scheduleFlush(namespace);
  }
}
