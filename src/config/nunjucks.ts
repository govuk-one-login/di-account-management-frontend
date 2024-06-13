import express from "express";
import * as nunjucks from "nunjucks";
import { Environment } from "nunjucks";
import i18next, { TFunction } from "i18next";
import { PATH_DATA } from "../app.constants.js";
import addLanguageParam from "@govuk-one-login/frontend-language-toggle";
import { safeTranslate } from "../utils/safeTranslate.js";

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
    const translate: TFunction<"translation", undefined> = i18next.getFixedT(
      this.ctx.i18n.language
    );
    return safeTranslate(translate, key, this.ctx.i18n.language, options);
  });

  nunjucksEnv.addGlobal("addLanguageParam", addLanguageParam);

  nunjucksEnv.addFilter("getPath", function (route: string) {
    if (!PATH_DATA[route]) {
      throw new Error(`Unknown route: ${route}`);
    }
    return PATH_DATA[route].url;
  });

  return nunjucksEnv;
}
