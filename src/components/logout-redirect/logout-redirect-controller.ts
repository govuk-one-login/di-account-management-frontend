import { Request, Response } from "express";
import { LogoutRedirect, LogoutState } from "../../app.constants";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

export async function logoutRedirectGet(
  req: Request,
  res: Response
): Promise<void> {
  req.metrics?.addMetric("logoutRedirectGet", MetricUnit.Count, 1);
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
