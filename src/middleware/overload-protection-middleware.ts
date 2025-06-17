import overloadProtection from "overload-protection";
import { sendCustomMetric } from "../utils/cloudwatch-metrics";
import { StandardUnit } from "@aws-sdk/client-cloudwatch";

export const applyOverloadProtection = (isProduction: boolean) => {
  sendCustomMetric({
    metricName: "changePasswordGet",
    unit: StandardUnit.Count,
    value: 1,
  });
  return overloadProtection("express", {
    production: isProduction,
    clientRetrySecs: 3,
    sampleInterval: 10,
    maxEventLoopDelay: 500,
    maxHeapUsedBytes: 0,
    maxRssBytes: 0,
    errorPropagationMode: false,
    logging: false,
    logStatsOnReq: false,
  });
};
