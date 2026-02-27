import { Request, Response } from "express";
import { handleLogout } from "../../utils/logout.js";
import { LogoutState } from "../../app.constants.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

export async function logoutPost(req: Request, res: Response): Promise<void> {
  req.metrics?.addMetric("logoutPost", MetricUnit.Count, 1);
  await handleLogout(req, res, LogoutState.Default);
}
