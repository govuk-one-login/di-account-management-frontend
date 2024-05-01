import { TFunction, TFunctionDetailedResult } from "i18next";
import { logger } from "./logger";
import { LOCALE } from "../app.constants";

export type translateResult = string | TFunctionDetailedResult<string, any>;

export const safeTranslate = (
  translate: TFunction<"translation", undefined>,
  key: string,
  options?: Record<string, any>
): translateResult => {
  const result: translateResult = translate(key, options);
  if (result === key) {
    logger.error(
      `TranslationError: key '${key}' missing for requested language.`
    );
    return translate(key, {
      ...options,
      fallbackLng: LOCALE.EN,
      nsSeparator: false,
    });
  }
  return result;
};
