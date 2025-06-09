import { TFunction, TFunctionDetailedResult } from "i18next";
import { logger } from "./logger";
import { LOCALE } from "../app.constants";
import { $SpecialObject } from "i18next/typescript/helpers";

export type translateResult =
  | string
  | TFunctionDetailedResult<string, any>
  | $SpecialObject;

export const safeTranslate = (
  translate: TFunction<"translation", undefined>,
  key: string,
  requestedLanguage: LOCALE,
  options?: Record<string, any>
): translateResult => {
  const result: translateResult = translate(key, options);
  if (result === key) {
    logger.error(
      `Safe Translate: translationError: key '${key}' missing for requested '${requestedLanguage}' language.`
    );
    return translate(key, {
      ...options,
      fallbackLng: LOCALE.EN,
      nsSeparator: false,
    });
  }
  return result;
};
