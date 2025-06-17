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

export async function sendCustomMetric({
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
}): Promise<void> {
  const metric: MetricDatum = {
    MetricName: metricName,
    Unit: unit,
    Value: value,
    Dimensions: dimensions,
    Timestamp: timestamp,
  };

  await cloudWatchClient
    .send(
      new PutMetricDataCommand({
        Namespace: namespace,
        MetricData: [metric],
      })
    )
    .catch((err) => {
      logger.error("Failed to send custom CloudWatch metric", err);
    });
}
