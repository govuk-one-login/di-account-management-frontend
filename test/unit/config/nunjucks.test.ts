import { expect } from "chai";
import { describe } from "mocha";
import { sinon } from "../../utils/test-utils";
import * as nunjucks from "nunjucks";
import express from "express";
import i18next, { TFunction } from "i18next";
import { configureNunjucks } from "../../../src/config/nunjucks";
import { SinonStub } from "sinon";

type MyStubType = TFunction & SinonStub;

describe("configureNunjucks Filters", () => {
  let app: express.Application;
  let nunjucksEnv: nunjucks.Environment;

  beforeEach(() => {
    app = {
      set: sinon.stub(),
    } as any; // Typecast to any to bypass TypeScript's strict typing
    nunjucksEnv = configureNunjucks(app, ["./views"]);
  });

  describe("translate filter", () => {
    it("should translate based on i18n language", () => {
      const fixedTStub = sinon
        .stub()
        .returns("translated_value") as unknown as MyStubType;
      sinon.stub(i18next, "getFixedT").returns(fixedTStub);

      const translateFilter = nunjucksEnv.getFilter("translate");
      const result = translateFilter.call(
        { ctx: { i18n: { language: "en" } } },
        "test_key"
      );

      expect(result).to.equal("translated_value");
      expect(fixedTStub.calledWith("test_key")).to.be.true;
    });
    it("should throw an error if translation key does no exist", () => {
      const fixedTStub = sinon
        .stub()
        .returns(undefined) as unknown as MyStubType;
      sinon.stub(i18next, "getFixedT").returns(fixedTStub);

      const translateFilter = nunjucksEnv.getFilter("translate");
      const result = translateFilter.call(
        { ctx: { i18n: { language: "en" } } },
        "test_key"
      );

      expect(result).to.equal(undefined);
      expect(fixedTStub.calledWith("test_key")).to.be.true;
    });
  });

  describe("addLanguageParam filter", () => {
    let addLanguageParamFilter: (
      url: string,
      language: string,
      base: string
    ) => string;

    beforeEach(() => {
      addLanguageParamFilter = nunjucksEnv.getFilter("addLanguageParam");
    });

    it("should add language parameter to URL without any existing parameters", () => {
      const result = addLanguageParamFilter(
        "http://example.com/path",
        "en",
        "http://example.com/"
      );
      expect(result).to.equal("/path?lng=en");
    });

    it("should add language parameter to URL with existing parameters", () => {
      const result = addLanguageParamFilter(
        "http://example.com/path?param1=value1&param2=value2",
        "en",
        "http://example.com/"
      );
      expect(result).to.include("/path?");
      expect(result).to.include("param1=value1");
      expect(result).to.include("param2=value2");
      expect(result).to.include("lng=en");
    });

    it("should not duplicate the language parameter in URL", () => {
      const result = addLanguageParamFilter(
        "http://example.com/path?lng=fr&param=value",
        "en",
        "http://example.com/"
      );
      expect(result).to.include("/path?");
      expect(result).to.include("param=value");
      expect(result).to.include("lng=en");
      expect(result.split("lng=").length - 1).to.equal(1); // ensures 'lng' parameter appears only once
    });
  });

  afterEach(() => {
    // Restore the stubbed methods after each test
    sinon.restore();
  });
});
