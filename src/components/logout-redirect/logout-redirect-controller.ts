import { Request, Response } from "express";
import { LogoutRedirect, LogoutState } from "../../app.constants";
import { StandardUnit } from "@aws-sdk/client-cloudwatch";
import { sendCustomMetric } from "../../utils/cloudwatch-metrics";

export async function logoutRedirectGet(
  req: Request,
  res: Response
): Promise<void> {
  sendCustomMetric({
    metricName: "logoutRedirectGet",
    unit: StandardUnit.Count,
    value: 1,
  });
  const state = req.query?.state;

  if (state === LogoutState.Suspended) {
    res.redirect(LogoutRedirect[LogoutState.Suspended].url);
  } else if (state === LogoutState.Blocked) {
    res.redirect(LogoutRedirect[LogoutState.Blocked].url);
  } else if (state === LogoutState.AccountDeletion) {
    res.redirect(LogoutRedirect[LogoutState.AccountDeletion].url);
  } else {
    res.redirect(LogoutRedirect[LogoutState.Default].url);
  }
}
