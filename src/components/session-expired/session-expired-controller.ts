import { Request, Response } from "express";
import { EMPTY_OPL_SETTING_VALUE, setOplSettings } from "../../utils/opl";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

export function sessionExpiredGet(req: Request, res: Response): void {
  req.metrics?.addMetric("sessionExpiredGet", MetricUnit.Count, 1);
  res.status(401);

  setOplSettings(
    {
      contentId: "cb2b2652-caa0-4aca-9b41-53c8bf9e1cd1",
      taxonomyLevel2: EMPTY_OPL_SETTING_VALUE,
    },
    res
  );

  res.render("session-expired/index.njk", { hideAccountNavigation: true });
}
