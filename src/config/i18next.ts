import { ENVIRONMENT_NAME, LOCALE } from "../app.constants.js";
import { getNodeEnv, getServiceDomain, supportLanguageCY } from "../config.js";
import type { InitOptions } from "i18next/typescript/options";

export function i18nextConfigurationOptions(path: string): InitOptions {
  return {
    debug: false,
    fallbackLng: getNodeEnv() === ENVIRONMENT_NAME.TEST ? LOCALE.EN : "",
    preload: [LOCALE.EN],
    supportedLngs: supportLanguageCY() ? [LOCALE.EN, LOCALE.CY] : [LOCALE.EN],
    backend: {
      loadPath: path,
      allowMultiLoading: true,
    },
    detection: {
      lookupCookie: "lng",
      lookupQuerystring: "lng",
      order: ["querystring", "cookie"],
      caches: ["cookie"],
      ignoreCase: true,
      cookieSecure: true,
      cookieDomain: getServiceDomain(),
      cookieSameSite: "",
    },
  };
}
