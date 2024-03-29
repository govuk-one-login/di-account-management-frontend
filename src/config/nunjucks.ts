import express from "express";
import * as nunjucks from "nunjucks";
import i18next, { DefaultNamespace, TFunction } from "i18next";
import { Environment } from "nunjucks";

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
    const translate: TFunction<DefaultNamespace, undefined> = i18next.getFixedT(
      this.ctx.i18n.language
    );
    return translate(key, options);
  });

  nunjucksEnv.addFilter(
    "addLanguageParam",
    function (url: string, language: string, base: string) {
      const parsedUrl = new URL(url, base);
      parsedUrl.searchParams.set("lng", language);
      return parsedUrl.pathname + parsedUrl.search;
    }
  );

  return nunjucksEnv;
}
