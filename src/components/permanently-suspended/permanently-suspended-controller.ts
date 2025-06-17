import { StandardUnit } from "@aws-sdk/client-cloudwatch";
import type { Request, Response } from "express";
import { sendCustomMetric } from "../../utils/cloudwatch-metrics";

export function permanentlySuspendedGet(req: Request, res: Response): void {
  sendCustomMetric({
    metricName: "permanentlySuspendedGet",
    unit: StandardUnit.Count,
    value: 1,
  });
  res.status(401);
  res.render("permanently-suspended/index.njk");
}
