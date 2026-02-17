import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as nunjucks from "nunjucks";
import express from "express";
import i18next, { TFunction } from "i18next";
import { configureNunjucks } from "../../../src/config/nunjucks.js";
import { EXTERNAL_URLS } from "../../../src/app.constants.js";

type MyStubType = TFunction & ReturnType<typeof vi.fn>;

describe("configureNunjucks", () => {
  let app: express.Application;
  let nunjucksEnv: nunjucks.Environment;

  beforeEach(() => {
    app = {
      set: vi.fn(),
    } as any; // Typecast to any to bypass TypeScript's strict typing
    nunjucksEnv = configureNunjucks(app, ["./views"]);
  });

  describe("translate filter", () => {
    it("should translate based on i18n language", () => {
      const fixedTStub = vi
        .fn()
        .mockReturnValue("translated_value") as unknown as MyStubType;
      vi.spyOn(i18next, "getFixedT").mockReturnValue(fixedTStub);

      const translateFilter = nunjucksEnv.getFilter("translate");
      const result = translateFilter.call(
        { ctx: { i18n: { language: "en" } } },
        "test_key"
      );

      expect(result).toBe("translated_value");
      expect(fixedTStub).toHaveBeenCalledWith("test_key", undefined);
    });

    it("should translate based on default language", () => {
      const fixedTStub = vi
        .fn()
        .mockReturnValue("translated_value") as unknown as MyStubType;
      vi.spyOn(i18next, "getFixedT").mockReturnValue(fixedTStub);

      const translateFilter = nunjucksEnv.getFilter("translate");
      const result = translateFilter.call({}, "test_key");

      expect(result).toBe("translated_value");
      expect(fixedTStub).toHaveBeenCalledWith("test_key", undefined);
    });

    it("should throw an error if translation key does no exist", () => {
      const fixedTStub = vi
        .fn()
        .mockReturnValue(undefined) as unknown as MyStubType;
      vi.spyOn(i18next, "getFixedT").mockReturnValue(fixedTStub);

      const translateFilter = nunjucksEnv.getFilter("translate");
      const result = translateFilter.call(
        { ctx: { i18n: { language: "en" } } },
        "test_key"
      );

      expect(result).toBe(undefined);
      expect(fixedTStub).toHaveBeenCalledWith("test_key", undefined);
    });

    it("should translate fallback to en if false lang is passed", () => {
      const fixedTStub = vi
        .fn()
        .mockReturnValue("translated_value") as unknown as MyStubType;
      const getFixedTStub = vi
        .spyOn(i18next, "getFixedT")
        .mockReturnValue(fixedTStub);

      const translateFilter = nunjucksEnv.getFilter("translate");
      const result = translateFilter.call(
        { ctx: { i18n: { language: "" } } },
        "test_key"
      );

      expect(result).toBe("translated_value");
      expect(getFixedTStub.mock.calls[0][0]).toBe("en");
      expect(fixedTStub).toHaveBeenCalledWith("test_key", undefined);
    });
  });

  describe("external URL filter", () => {
    it("should return the external URL when it exists", () => {
      const externalUrlFilter = nunjucksEnv.getFilter("getExternalUrl");
      const result = externalUrlFilter.call({}, "PRIVACY_NOTICE");

      expect(result).toBe(EXTERNAL_URLS.PRIVACY_NOTICE);
    });

    it("should throw an error when the external URL does not exist", () => {
      const externalUrlFilter = nunjucksEnv.getFilter("getExternalUrl");

      expect(() => {
        externalUrlFilter.call({}, "UNKNOWN_KEY");
      }).toThrow("Unknown URL: UNKNOWN_KEY");
    });
  });

  describe("rebrand flag", () => {
    it("should return true", () => {
      nunjucksEnv = configureNunjucks(app, ["./views"]);
      expect(nunjucksEnv.getGlobal("govukRebrand")).toBe(true);
    });
  });

  afterEach(() => {
    // Restore the stubbed methods after each test
    vi.restoreAllMocks();
  });
});
