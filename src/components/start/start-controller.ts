import { Request, Response } from "express";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { redirectToLogIn } from "../../middleware/requires-auth-middleware";

export async function startGet(req: Request, res: Response): Promise<void> {
  req.metrics?.addMetric("signedOutGet", MetricUnit.Count, 1);
  await redirectToLogIn(req, res);
}
