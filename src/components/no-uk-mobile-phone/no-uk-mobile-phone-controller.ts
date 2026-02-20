import { Request, Response } from "express";
import { PATH_DATA } from "../../app.constants";
import {
  mfaMethodTypes,
  mfaPriorityIdentifiers,
} from "../../utils/mfaClient/types";
import { MFA_COMMON_OPL_SETTINGS, setOplSettings } from "../../utils/opl";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

const NO_UK_PHONE_NUMBER_TEMPLATE = "no-uk-mobile-phone/index.njk";

const setLocalOplSettings = (req: Request, res: Response) => {
  setOplSettings(
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "a8d82f1b-c682-433b-8695-34343afb9666",
    },
    res
  );
};

export function noUkPhoneNumberGet(req: Request, res: Response): void {
  req.metrics?.addMetric("noUkPhoneNumberGet", MetricUnit.Count, 1);
  setLocalOplSettings(req, res);

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
    let queryType = "";

    if (origin.includes(PATH_DATA.CHANGE_PHONE_NUMBER.url)) {
      queryType = "changePhoneNumber";
    } else if (
      origin.includes(PATH_DATA.CHANGE_DEFAULT_METHOD.url) ||
      origin.includes(PATH_DATA.CHANGE_DEFAULT_METHOD_SMS.url)
    ) {
      queryType = "changeDefaultMethod";
    } else {
      queryType = "unknownType";
    }

    const hasBackUpQuery = hasBackupAuthApp ? "&BackupAuthApp" : "";

    return res.redirect(
      `${PATH_DATA.NO_UK_PHONE_NUMBER.url}?type=${queryType}${hasBackUpQuery}`
    );
  }

  res.render(NO_UK_PHONE_NUMBER_TEMPLATE, { hasBackupAuthApp, hasAuthApp });
}
