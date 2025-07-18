import { Response } from "express";

interface OplSettings {
  contentId?: string;
  taxonomyLevel1?: string;
  taxonomyLevel2?: string;
  taxonomyLevel3?: string;
  loggedInStatus?: boolean;
  dynamic?: boolean;
  isPageDataSensitive?: boolean;
}

export type OplSettingsLookupObject = Record<string, Partial<OplSettings>>;

export const EMPTY_OPL_SETTING_VALUE = "undefined";

export const MFA_COMMON_OPL_SETTINGS: Partial<OplSettings> = {
  taxonomyLevel3: "MFA Method Management",
};
export const CHANGE_EMAIL_COMMON_OPL_SETTINGS: Partial<OplSettings> = {
  taxonomyLevel2: "change email",
};
export const CHANGE_PASSWORD_COMMON_OPL_SETTINGS: Partial<OplSettings> = {
  taxonomyLevel2: "change password",
};
export const DELETE_ACCOUNT_COMMON_OPL_SETTINGS: Partial<OplSettings> = {
  taxonomyLevel2: "delete account",
};
export const ACTIVITY_COMMON_OPL_SETTINGS: Partial<OplSettings> = {
  taxonomyLevel2: "activity",
};

export const setOplSettings = (
  settings: Partial<OplSettings> | undefined,
  res: Response
): void => {
  const mergedSettings: OplSettings = {
    loggedInStatus: settings?.loggedInStatus ?? true,
    dynamic: settings?.dynamic ?? true,
    isPageDataSensitive: settings?.isPageDataSensitive ?? true,
    taxonomyLevel1: settings?.taxonomyLevel1 ?? "accounts",
    taxonomyLevel2: settings?.taxonomyLevel2 ?? "home",
    taxonomyLevel3: settings?.taxonomyLevel3 ?? EMPTY_OPL_SETTING_VALUE,
    contentId: settings?.contentId ?? EMPTY_OPL_SETTING_VALUE,
  };

  res.locals.opl = mergedSettings;
};
