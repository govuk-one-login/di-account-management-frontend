import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";
import { TFunction } from "i18next";
import { logger } from "../../../src/utils/logger.js";

import { safeTranslate } from "../../../src/utils/safeTranslate.js";
import { LOCALE } from "../../../src/app.constants.js";

describe("safeTranslate", () => {
  let translate: sinon.SinonStub<[string, any?], string>;
  let logErrorSpy: sinon.SinonSpy;
  const requestedLanguage = LOCALE.CY;

  beforeEach(() => {
    translate = sinon.stub();
    logErrorSpy = sinon.spy(logger, "error");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("returns translation when available", () => {
    const key = "hello";
    const translation = "Hello";
    translate.withArgs(key, sinon.match.any).returns(translation);

    const result = safeTranslate(
      translate as unknown as TFunction<"translation", undefined>,
      key,
      requestedLanguage
    );
    expect(result).to.equal(translation);
    expect(translate.calledWith(key)).to.be.true;
  });

  it("returns fallback translation when key is missing", () => {
    const key = "greeting";
    const fallbackTranslation = "Hello";
    translate.withArgs(key, sinon.match.any).returns(key);
    translate
      .withArgs(key, sinon.match.has("fallbackLng", "en"))
      .returns(fallbackTranslation);

    const result = safeTranslate(
      translate as unknown as TFunction<"translation", undefined>,
      key,
      requestedLanguage,
      { lng: "cy" }
    );
    expect(result).to.equal(fallbackTranslation);
    expect(translate.calledTwice).to.be.true;
    expect(
      logErrorSpy.calledWith(
        `Safe Translate: translationError: key '${key}' missing for requested '${requestedLanguage}' language.`
      )
    ).to.be.true;
  });

  it("logs error and uses key as fallback when both translations are missing", () => {
    const key = "welcome";
    translate.withArgs(key, sinon.match.any).returns(key);
    translate.withArgs(key, sinon.match.has("fallbackLng", "en")).returns(key);

    const result = safeTranslate(
      translate as unknown as TFunction<"translation", undefined>,
      key,
      requestedLanguage
    );
    expect(result).to.equal(key);
    expect(
      translate.secondCall.calledWith(key, {
        fallbackLng: "en",
        nsSeparator: false,
      })
    ).to.be.true;
    expect(
      logErrorSpy.calledWith(
        `Safe Translate: translationError: key '${key}' missing for requested '${requestedLanguage}' language.`
      )
    ).to.be.true;
  });
});
