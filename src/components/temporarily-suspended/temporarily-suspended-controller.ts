import { MetricUnit } from "@aws-lambda-powertools/metrics";
import type { Request, Response } from "express";

export function temporarilySuspendedGet(req: Request, res: Response): void {
  req.metrics?.addMetric("temporarilySuspendedGet", MetricUnit.Count, 1);
  res.status(401);
  res.render("temporarily-suspended/index.njk");
}
