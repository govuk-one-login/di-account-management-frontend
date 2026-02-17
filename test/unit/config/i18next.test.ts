import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { i18nextConfigurationOptions } from "../../../src/config/i18next.js";
import { LOCALE } from "../../../src/app.constants.js";
import * as config from "../../../src/config.js";

describe("i18next config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("i18nextConfigurationOptions", () => {
    it("should return configuration object", () => {
      vi.spyOn(config, "getServiceDomain").mockReturnValue("example.com");

      const result = i18nextConfigurationOptions();

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    it("should have debug set to false", () => {
      vi.spyOn(config, "getServiceDomain").mockReturnValue("example.com");

      const result = i18nextConfigurationOptions();

      expect(result.debug).toBe(false);
    });

    it("should have fallbackLng set to EN", () => {
      vi.spyOn(config, "getServiceDomain").mockReturnValue("example.com");

      const result = i18nextConfigurationOptions();

      expect(result.fallbackLng).toBe(LOCALE.EN);
    });

    it("should have preload set to EN only", () => {
      vi.spyOn(config, "getServiceDomain").mockReturnValue("example.com");

      const result = i18nextConfigurationOptions();

      expect(result.preload).toEqual([LOCALE.EN]);
    });

    it("should have supportedLngs with EN and CY", () => {
      vi.spyOn(config, "getServiceDomain").mockReturnValue("example.com");

      const result = i18nextConfigurationOptions();

      expect(result.supportedLngs).toEqual([LOCALE.EN, LOCALE.CY]);
    });

    it("should have detection configuration with lookupCookie", () => {
      vi.spyOn(config, "getServiceDomain").mockReturnValue("example.com");

      const result = i18nextConfigurationOptions();

      expect(result.detection?.lookupCookie).toBe("lng");
    });

    it("should have detection configuration with lookupQuerystring", () => {
      vi.spyOn(config, "getServiceDomain").mockReturnValue("example.com");

      const result = i18nextConfigurationOptions();

      expect(result.detection?.lookupQuerystring).toBe("lng");
    });

    it("should have detection order set to querystring then cookie", () => {
      vi.spyOn(config, "getServiceDomain").mockReturnValue("example.com");

      const result = i18nextConfigurationOptions();

      expect(result.detection?.order).toEqual(["querystring", "cookie"]);
    });

    it("should have detection caches set to cookie", () => {
      vi.spyOn(config, "getServiceDomain").mockReturnValue("example.com");

      const result = i18nextConfigurationOptions();

      expect(result.detection?.caches).toEqual(["cookie"]);
    });

    it("should have ignoreCase set to true", () => {
      vi.spyOn(config, "getServiceDomain").mockReturnValue("example.com");

      const result = i18nextConfigurationOptions();

      expect(result.detection?.ignoreCase).toBe(true);
    });

    it("should have cookieSecure set to true", () => {
      vi.spyOn(config, "getServiceDomain").mockReturnValue("example.com");

      const result = i18nextConfigurationOptions();

      expect(result.detection?.cookieSecure).toBe(true);
    });

    it("should set cookieDomain from getServiceDomain", () => {
      vi.spyOn(config, "getServiceDomain").mockReturnValue("test.gov.uk");

      const result = i18nextConfigurationOptions();

      expect(result.detection?.cookieDomain).toBe("test.gov.uk");
    });

    it("should handle different service domains", () => {
      vi.spyOn(config, "getServiceDomain").mockReturnValue(
        "another-domain.com"
      );

      const result = i18nextConfigurationOptions();

      expect(result.detection?.cookieDomain).toBe("another-domain.com");
    });

    it("should have cookieSameSite set to empty string", () => {
      vi.spyOn(config, "getServiceDomain").mockReturnValue("example.com");

      const result = i18nextConfigurationOptions();

      expect(result.detection?.cookieSameSite).toBe("");
    });

    it("should call getServiceDomain once", () => {
      const spy = vi
        .spyOn(config, "getServiceDomain")
        .mockReturnValue("example.com");

      i18nextConfigurationOptions();

      expect(spy).toHaveBeenCalledOnce();
    });
  });
});
