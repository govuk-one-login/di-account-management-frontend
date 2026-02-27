import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TFunction } from "i18next";
import { logger } from "../../../src/utils/logger.js";

import { safeTranslate } from "../../../src/utils/safeTranslate.js";
import { LOCALE } from "../../../src/app.constants.js";

describe("safeTranslate", () => {
  let translate: ReturnType<typeof vi.fn>;
  let logErrorSpy: ReturnType<typeof vi.fn>;
  const requestedLanguage = LOCALE.CY;

  beforeEach(() => {
    translate = vi.fn();
    logErrorSpy = vi.spyOn(logger, "error");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns translation when available", () => {
    const key = "hello";
    const translation = "Hello";
    translate.mockReturnValue(translation);

    const result = safeTranslate(
      translate as unknown as TFunction<"translation", undefined>,
      key,
      requestedLanguage
    );
    expect(result).toBe(translation);
    expect(translate).toHaveBeenCalledWith(key, undefined);
  });

  it("returns fallback translation when key is missing", () => {
    const key = "greeting";
    const fallbackTranslation = "Hello";
    translate.mockReturnValueOnce(key).mockReturnValueOnce(fallbackTranslation);

    const result = safeTranslate(
      translate as unknown as TFunction<"translation", undefined>,
      key,
      requestedLanguage,
      { lng: "cy" }
    );
    expect(result).toBe(fallbackTranslation);
    expect(translate).toHaveBeenCalledTimes(2);
    expect(logErrorSpy).toHaveBeenCalledWith(
      `Safe Translate: translationError: key '${key}' missing for requested '${requestedLanguage}' language.`
    );
  });

  it("logs error and uses key as fallback when both translations are missing", () => {
    const key = "welcome";
    translate.mockReturnValue(key);

    const result = safeTranslate(
      translate as unknown as TFunction<"translation", undefined>,
      key,
      requestedLanguage
    );
    expect(result).toBe(key);
    expect(translate).toHaveBeenCalledTimes(2);
    expect(translate).toHaveBeenNthCalledWith(2, key, {
      fallbackLng: "en",
      nsSeparator: false,
    });
    expect(logErrorSpy).toHaveBeenCalledWith(
      `Safe Translate: translationError: key '${key}' missing for requested '${requestedLanguage}' language.`
    );
  });
});
