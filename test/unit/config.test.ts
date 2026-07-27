import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getListOfAccountClientIDs,
  getListOfServiceClientIDs,
  isIntegration,
  passkeysEnabled,
} from "../../src/config.js";
describe("config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Service configuration", () => {
    it("should have no services in the accounts list that are in the other services list", () => {
      expect(
        getListOfAccountClientIDs.filter((service) =>
          getListOfServiceClientIDs.includes(service)
        ).length
      ).toBe(0);
    });

    it("should have no services in the other services list that are in the accounts list", () => {
      expect(
        getListOfServiceClientIDs.filter((service) =>
          getListOfAccountClientIDs.includes(service)
        ).length
      ).toBe(0);
    });
  });

  describe("Environment checks", () => {
    it("should return true when APP_ENV is integration", () => {
      vi.stubEnv("APP_ENV", "integration");
      expect(isIntegration()).toBe(true);
    });

    it("should return false when APP_ENV is not integration", () => {
      vi.stubEnv("APP_ENV", "production");
      expect(isIntegration()).toBe(false);
    });

    it("should return false when APP_ENV is local", () => {
      vi.stubEnv("APP_ENV", "local");
      expect(isIntegration()).toBe(false);
    });
  });

  describe("passkeysEnabled", () => {
    it("should return false when PASSKEYS env var is not set", () => {
      vi.stubEnv("PASSKEYS", "");
      expect(passkeysEnabled()).toBe(false);
    });

    it("should return true when PASSKEYS is enabled", () => {
      vi.stubEnv("PASSKEYS", "1");
      expect(passkeysEnabled()).toBe(true);
    });
  });
});
