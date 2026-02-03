import { Request, Response } from "express";
import { EMPTY_OPL_SETTING_VALUE, setOplSettings } from "../../utils/opl.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

export function sessionExpiredGet(req: Request, res: Response): void {
  req.metrics?.addMetric("sessionExpiredGet", MetricUnit.Count, 1);
  res.status(401);

  setOplSettings(
    {
      contentId: "e7dc72c9-74e8-4924-bd0f-dc113f14db35",
      taxonomyLevel2: EMPTY_OPL_SETTING_VALUE,
    },
    res
  );

  res.render("session-expired/index.njk", { hideAccountNavigation: true });
}
