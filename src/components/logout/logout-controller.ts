import { Request, Response } from "express";
import { handleLogout } from "../../utils/logout";
import { LogoutState } from "../../app.constants";
import { StandardUnit } from "@aws-sdk/client-cloudwatch";
import { sendCustomMetric } from "../../utils/cloudwatch-metrics";

export async function logoutPost(req: Request, res: Response): Promise<void> {
  sendCustomMetric({
    metricName: "logoutPost",
    unit: StandardUnit.Count,
    value: 1,
  });
  await handleLogout(req, res, LogoutState.Default);
}
