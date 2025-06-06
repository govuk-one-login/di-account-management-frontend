import { Response } from "express";

export interface OplSettings {
  contentId?: string;
  taxonomyLevel1?: string;
  taxonomyLevel2?: string;
  taxonomyLevel3?: string;
  statusCode?: number;
  loggedInStatus?: boolean;
  dynamic?: boolean;
}

export const EMPTY_OPL_SETTING_VALUE = "undefined";

export const setOplSettings = (
  settings: Partial<OplSettings>,
  res: Response
): void => {
  const mergedSettings: OplSettings = {
    statusCode: settings.statusCode ?? 200,
    loggedInStatus: settings.loggedInStatus ?? true,
    dynamic: settings.dynamic ?? true,
    taxonomyLevel1: settings.taxonomyLevel1 ?? "accounts",
    taxonomyLevel2: settings.taxonomyLevel2 ?? "home",
    taxonomyLevel3: settings.taxonomyLevel3 ?? EMPTY_OPL_SETTING_VALUE,
    contentId: settings.contentId ?? EMPTY_OPL_SETTING_VALUE,
  };

  res.locals.opl = mergedSettings;
};
