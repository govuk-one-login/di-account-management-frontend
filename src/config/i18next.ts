import { LOCALE } from "../app.constants.js";
import { getRootDomain } from "../config.js";
import type { InitOptions } from "i18next";

export function i18nextConfigurationOptions(): InitOptions {
  return {
    debug: false,
    fallbackLng: LOCALE.EN,
    preload: [LOCALE.EN],
    supportedLngs: [LOCALE.EN, LOCALE.CY],
    detection: {
      lookupCookie: "lng",
      lookupQuerystring: "lng",
      order: ["querystring", "cookie"],
      caches: ["cookie"],
      ignoreCase: true,
      cookieSecure: true,
      cookieDomain: getRootDomain(),
      cookieSameSite: "",
    },
  };
}
