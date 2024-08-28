import { expect } from "chai";
import { describe } from "mocha";
import { sinon } from "../../utils/test-utils";
import * as nunjucks from "nunjucks";
import express from "express";
import i18next, { TFunction } from "i18next";
import { configureNunjucks } from "../../../src/config/nunjucks";
import { SinonStub } from "sinon";

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
  });

  afterEach(() => {
    // Restore the stubbed methods after each test
    sinon.restore();
  });
});
