import { StandardUnit } from "@aws-sdk/client-cloudwatch";
import type { Request, Response } from "express";
import { sendCustomMetric } from "../../utils/cloudwatch-metrics";

export function temporarilySuspendedGet(req: Request, res: Response): void {
  sendCustomMetric({
    metricName: "temporarilySuspendedGet",
    unit: StandardUnit.Count,
    value: 1,
  });
  res.status(401);
  res.render("temporarily-suspended/index.njk");
}
