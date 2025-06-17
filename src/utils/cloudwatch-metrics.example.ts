import { sendCustomMetric } from "../utils/cloudwatch-metrics";
import { StandardUnit } from "@aws-sdk/client-cloudwatch";

// Example: Send a metric for a successful login event
export function recordSuccessfulLogin(userId: string) {
  sendCustomMetric({
    metricName: "SuccessfulLogin",
    unit: StandardUnit.Count,
    value: 1,
    dimensions: [
      { Name: "UserId", Value: userId },
      { Name: "Environment", Value: process.env.NODE_ENV || "unknown" },
    ],
  });
}

// Example: Send a metric for response time
export function recordResponseTime(ms: number) {
  sendCustomMetric({
    metricName: "ResponseTime",
    unit: StandardUnit.Milliseconds,
    value: ms,
    dimensions: [
      { Name: "Environment", Value: process.env.NODE_ENV || "unknown" },
    ],
  });
}
