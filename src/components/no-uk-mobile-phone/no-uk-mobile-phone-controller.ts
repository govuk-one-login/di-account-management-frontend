import { Request, Response } from "express";
import { PATH_DATA } from "../../app.constants.js";
import {
  mfaMethodTypes,
  mfaPriorityIdentifiers,
} from "../../utils/mfaClient/types.js";
import {
  EMPTY_OPL_SETTING_VALUE,
  MFA_COMMON_OPL_SETTINGS,
  OplSettingsLookupObject,
  setOplSettings,
} from "../../utils/opl.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

const NO_UK_PHONE_NUMBER_TEMPLATE = "no-uk-mobile-phone/index.njk";

const getOplValues = (): OplSettingsLookupObject => ({
  changePhoneNumber: {
    ...MFA_COMMON_OPL_SETTINGS,
    contentId: "6e807956-3e2c-4fcf-a11a-e6d19c98593d",
  },
  changeDefaultMethod: {
    ...MFA_COMMON_OPL_SETTINGS,
    contentId: "40b345e2-4b21-47b1-ab10-36cd9374eede",
  },
  unknownType: {
    ...MFA_COMMON_OPL_SETTINGS,
    contentId: "4f8fcc9d-d8c3-4746-9093-90cb05e89c79",
  },
});

const setLocalOplSettings = (req: Request, res: Response) => {
  const requestType = typeof req.query.type === "string" ? req.query.type : "";

  setOplSettings(
    getOplValues()[requestType] ?? {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: EMPTY_OPL_SETTING_VALUE,
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
