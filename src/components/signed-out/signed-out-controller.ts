import { Request, Response } from "express";
import { PATH_DATA } from "../../app.constants";
import { EMPTY_OPL_SETTING_VALUE, setOplSettings } from "../../utils/opl";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

export function signedOutGet(req: Request, res: Response): void {
  req.metrics?.addMetric("signedOutGet", MetricUnit.Count, 1);
  res.status(200);

  setOplSettings(
    {
      contentId: "e7dc72c9-74e8-4924-bd0f-dc113f14db35",
      taxonomyLevel2: EMPTY_OPL_SETTING_VALUE,
    },
    res
  );

  res.render("signed-out/index.njk", {
    signinLink: PATH_DATA.START.url,
    hideAccountNavigation: true,
  });
}
