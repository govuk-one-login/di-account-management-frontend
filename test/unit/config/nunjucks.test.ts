import { expect } from "chai";
import { describe } from "mocha";
import { sinon } from "../../utils/test-utils";
import * as nunjucks from "nunjucks";
import express from "express";
import i18next, { TFunction } from "i18next";
import { configureNunjucks } from "../../../src/config/nunjucks";
import { SinonStub } from "sinon";
import { EXTERNAL_URLS } from "../../../src/app.constants";

type MyStubType = TFunction & SinonStub;

describe("configureNunjucks", () => {
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

    it("should translate based on default language", () => {
      const fixedTStub = sinon
        .stub()
        .returns("translated_value") as unknown as MyStubType;
      sinon.stub(i18next, "getFixedT").returns(fixedTStub);

      const translateFilter = nunjucksEnv.getFilter("translate");
      const result = translateFilter.call({}, "test_key");

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

    it("should translate fallback to en if false lang is passed", () => {
      const fixedTStub = sinon
        .stub()
        .returns("translated_value") as unknown as MyStubType;
      const getFixedTStub = sinon
        .stub(i18next, "getFixedT")
        .returns(fixedTStub);

      const translateFilter = nunjucksEnv.getFilter("translate");
      const result = translateFilter.call(
        { ctx: { i18n: { language: "" } } },
        "test_key"
      );

      expect(result).to.equal("translated_value");
      expect(getFixedTStub.firstCall.args[0]).to.equal("en");
      expect(fixedTStub.calledWith("test_key")).to.be.true;
    });
  });

  describe("external URL filter", () => {
    it("should return the external URL when it exists", () => {
      const externalUrlFilter = nunjucksEnv.getFilter("getExternalUrl");
      const result = externalUrlFilter.call({}, "PRIVACY_NOTICE");

      expect(result).to.equal(EXTERNAL_URLS.PRIVACY_NOTICE);
    });

    it("should throw an error when the external URL does not exist", () => {
      const externalUrlFilter = nunjucksEnv.getFilter("getExternalUrl");

      expect(() => {
        externalUrlFilter.call({}, "UNKNOWN_KEY");
      }).to.throw("Unknown URL: UNKNOWN_KEY");
    });
  });

  describe("rebrand flag", () => {
    it("should return true", () => {
      nunjucksEnv = configureNunjucks(app, ["./views"]);
      expect(nunjucksEnv.getGlobal("govukRebrand")).to.equal(true);
    });
  });

  afterEach(() => {
    // Restore the stubbed methods after each test
    sinon.restore();
  });
});
