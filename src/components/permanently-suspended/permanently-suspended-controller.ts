import { MetricUnit } from "@aws-lambda-powertools/metrics";
import type { Request, Response } from "express";

export function permanentlySuspendedGet(req: Request, res: Response): void {
  req.metrics?.addMetric("permanentlySuspendedGet", MetricUnit.Count, 1);
  res.status(401);
  res.render("permanently-suspended/index.njk");
}
