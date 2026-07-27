import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getListOfAccountClientIDs,
  getListOfServiceClientIDs,
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

  describe("passkeysEnabled", () => {
    let mockReq: Partial<Request>;

    beforeEach(() => {
      mockReq = {
        cookies: {},
      };
    });

    it("should return false when PASSKEYS env var is not set", () => {
      vi.stubEnv("PASSKEYS", undefined);
      vi.stubEnv("APP_ENV", "local");
      expect(passkeysEnabled(mockReq as Request)).toBe(false);
    });

    it("should return false when PASSKEYS env var is not '1'", () => {
      vi.stubEnv("PASSKEYS", "0");
      vi.stubEnv("APP_ENV", "local");
      expect(passkeysEnabled(mockReq as Request)).toBe(false);
    });

    it("should return true when PASSKEYS env var is '1'", () => {
      vi.stubEnv("PASSKEYS", "1");
      vi.stubEnv("APP_ENV", "local");
      expect(passkeysEnabled(mockReq as Request)).toBe(true);
    });
  });
});
