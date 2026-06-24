import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getListOfAccountClientIDs,
  getListOfServiceClientIDs,
  isIntegration,
  passkeysEnabled,
} from "../../src/config.js";
import { Request } from "express";

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
    let mockReq: Partial<Request>;

    beforeEach(() => {
      mockReq = {
        cookies: {},
      };
    });

    it("should return false when PASSKEYS env var is not set", () => {
      vi.stubEnv("PASSKEYS", "");
      vi.stubEnv("APP_ENV", "local");
      expect(passkeysEnabled(mockReq as Request)).toBe(false);
    });

    it("should return true in local environment when PASSKEYS is enabled", () => {
      vi.stubEnv("PASSKEYS", "1");
      vi.stubEnv("APP_ENV", "local");
      expect(passkeysEnabled(mockReq as Request)).toBe(true);
    });

    it("should return false in production environment without live proving cookie", () => {
      vi.stubEnv("PASSKEYS", "1");
      vi.stubEnv("APP_ENV", "production");
      expect(passkeysEnabled(mockReq as Request)).toBe(false);
    });

    it("should return false in integration environment without live proving cookie", () => {
      vi.stubEnv("PASSKEYS", "1");
      vi.stubEnv("APP_ENV", "integration");
      expect(passkeysEnabled(mockReq as Request)).toBe(false);
    });

    it("should return true in production environment with live proving cookie", () => {
      vi.stubEnv("PASSKEYS", "1");
      vi.stubEnv("APP_ENV", "production");
      mockReq.cookies = { passkeys_live_proving: "1" };
      expect(passkeysEnabled(mockReq as Request)).toBe(true);
    });

    it("should return true in integration environment with live proving cookie", () => {
      vi.stubEnv("PASSKEYS", "1");
      vi.stubEnv("APP_ENV", "integration");
      mockReq.cookies = { passkeys_live_proving: "1" };
      expect(passkeysEnabled(mockReq as Request)).toBe(true);
    });
  });
});
