import express from "express";
import * as nunjucks from "nunjucks";
import { Environment } from "nunjucks";
import i18next, { TFunction } from "i18next";
import { EXTERNAL_URLS, LOCALE, PATH_DATA } from "../app.constants";
import addLanguageParam from "@govuk-one-login/frontend-language-toggle";
import { safeTranslate } from "../utils/safeTranslate";
import { supportBrandRefresh } from "../config";

export function configureNunjucks(
  app: express.Application,
  viewsPath: string[]
): Environment {
  const nunjucksEnv: nunjucks.Environment = nunjucks.configure(viewsPath, {
    autoescape: true,
    express: app,
    noCache: true,
  });

  nunjucksEnv.addFilter("translate", function (key: string, options?: any) {
    const currentLanguage = this.ctx?.i18n?.language ?? LOCALE.EN;
    const translate: TFunction<"translation", undefined> =
      i18next.getFixedT(currentLanguage);
    return safeTranslate(translate, key, currentLanguage, options);
  });

  nunjucksEnv.addGlobal("addLanguageParam", addLanguageParam);
  nunjucksEnv.addGlobal("govukRebrand", supportBrandRefresh());

  nunjucksEnv.addFilter("getPath", function (route: string) {
    if (!PATH_DATA[route]) {
      throw new Error(`Unknown route: ${route}`);
    }
    return PATH_DATA[route].url;
  });

  nunjucksEnv.addFilter(
    "getExternalUrl",
    function (key: keyof typeof EXTERNAL_URLS) {
      if (!EXTERNAL_URLS[key]) {
        throw new Error(`Unknown URL: ${key}`);
      }
      return EXTERNAL_URLS[key];
    }
  );

  return nunjucksEnv;
}
