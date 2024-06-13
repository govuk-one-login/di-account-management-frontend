import { TFunction, TFunctionDetailedResult } from "i18next";
import { logger } from "./logger.js";
import { LOCALE } from "../app.constants.js";

export type translateResult = string | TFunctionDetailedResult<string, any>;

export const safeTranslate = (
  translate: TFunction<"translation", undefined>,
  key: string,
  requestedLanguage: string,
  options?: Record<string, any>
): translateResult => {
  const result: translateResult = translate(key, options);
  if (result === key) {
    logger.error(
      `TranslationError: key '${key}' missing for requested '${requestedLanguage}' language.`
    );
    return translate(key, {
      ...options,
      fallbackLng: LOCALE.EN,
      nsSeparator: false,
    });
  }
  return result;
};
