import { Request, Response } from "express";
import { PATH_DATA } from "../../app.constants.js";
import {
  mfaMethodTypes,
  mfaPriorityIdentifiers,
} from "../../utils/mfaClient/types.js";
import { MFA_COMMON_OPL_SETTINGS, setOplSettings } from "../../utils/opl.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

const NO_UK_PHONE_NUMBER_TEMPLATE = "no-uk-mobile-phone/index.njk";

const setLocalOplSettings = (
  req: Request,
  res: Response,
  contentId: string
) => {
  setOplSettings(
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: contentId,
    },
    res
  );
};

export function noUkPhoneNumberGet(req: Request, res: Response): void {
  req.metrics?.addMetric("noUkPhoneNumberGet", MetricUnit.Count, 1);

  const origin = req.headers["referer"] || "unknown origin";

  const hasBackupAuthApp =
    req.session.mfaMethods?.some(
      (mfaMethod) =>
        mfaMethod.method.mfaMethodType === mfaMethodTypes.authApp &&
        mfaMethod.priorityIdentifier === mfaPriorityIdentifiers.backup
    ) || false;

  const hasAuthApp =
    req.session.mfaMethods?.some(
      (mfaMethod) =>
        mfaMethod.method.mfaMethodType === mfaMethodTypes.authApp &&
        mfaMethod.priorityIdentifier === mfaPriorityIdentifiers.default
    ) || false;

  if (!req.query.type || req.query.type === "") {
    let queryType = "",
      contentId = "";

    if (origin.includes(PATH_DATA.CHANGE_PHONE_NUMBER.url)) {
      queryType = "changePhoneNumber";
      contentId = "6e807956-3e2c-4fcf-a11a-e6d19c98593d";
    } else if (
      origin.includes(PATH_DATA.CHANGE_DEFAULT_METHOD.url) ||
      origin.includes(PATH_DATA.CHANGE_DEFAULT_METHOD_SMS.url)
    ) {
      queryType = "changeDefaultMethod";
      contentId = "40b345e2-4b21-47b1-ab10-36cd9374eede";
    } else {
      queryType = "unknownType";
      contentId = "4f8fcc9d-d8c3-4746-9093-90cb05e89c79";
    }

    const hasBackUpQuery = hasBackupAuthApp ? "&BackupAuthApp" : "";

    setLocalOplSettings(req, res, contentId);

    return res.redirect(
      `${PATH_DATA.NO_UK_PHONE_NUMBER.url}?type=${queryType}${hasBackUpQuery}`
    );
  }

  res.render(NO_UK_PHONE_NUMBER_TEMPLATE, { hasBackupAuthApp, hasAuthApp });
}
