import { Request, Response } from "express";
import { supportGlobalLogout } from "../../config.js";
import { PATH_DATA } from "../../app.constants.js";
import { setOplSettings } from "../../utils/opl.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import {
  mapMfaMethods,
  canChangePrimaryMethod,
} from "../../utils/mfa/index.js";

export async function securityGet(req: Request, res: Response): Promise<void> {
  req.metrics?.addMetric("securityGet", MetricUnit.Count, 1);
  const { email } = req.session.user;
  const enterPasswordUrl = `${PATH_DATA.ENTER_PASSWORD.url}?from=security&edit=true`;
  const mfaMethods = Array.isArray(req.session.mfaMethods)
    ? mapMfaMethods(req.session.mfaMethods, enterPasswordUrl, req.t)
    : [];

  const denyChangeTypeofPrimary = Array.isArray(req.session.mfaMethods)
    ? canChangePrimaryMethod(req.session.mfaMethods)
    : false;

  setOplSettings(
    {
      contentId: "caaccf0a-1dd3-441c-af20-01925c8f9cba",
    },
    res
  );

  res.render("security/index.njk", {
    email,
    activityLogUrl: PATH_DATA.SIGN_IN_HISTORY.url,
    enterPasswordUrl,
    mfaMethods,
    canChangeTypeofPrimary: !denyChangeTypeofPrimary,
    supportGlobalLogout: supportGlobalLogout(),
  });
}
