import { describe, it, expect } from "vitest";
import { getSessionCookieOptions } from "../../../src/config/cookie.js";

describe("cookie config", () => {
  describe("getSessionCookieOptions", () => {
    it("should return cookie options with secure true in production environment", () => {
      const result = getSessionCookieOptions(true);

      expect(result).toEqual({
        secure: true,
      });
    });

    it("should return cookie options with secure false in non-production environment", () => {
      const result = getSessionCookieOptions(false);

      expect(result).toEqual({
        secure: false,
      });
    });

    it("should not set maxAge when no maxAge is provided, so the cookie is session-scoped", () => {
      const result = getSessionCookieOptions(true);

      expect(result.maxAge).toBeUndefined();
    });

    it("should not set expires when no maxAge is provided, so the cookie is session-scoped", () => {
      const result = getSessionCookieOptions(false);

      expect(result.expires).toBeUndefined();
    });

    it("should set maxAge when an explicit maxAge is provided", () => {
      const result = getSessionCookieOptions(true, 3600000);

      expect(result).toEqual({
        secure: true,
        maxAge: 3600000,
      });
    });

    it("should set maxAge to 0 when an explicit maxAge of 0 is provided", () => {
      const result = getSessionCookieOptions(true, 0);

      expect(result.maxAge).toBe(0);
    });

    it("should not set maxAge when explicitly passed undefined", () => {
      const result = getSessionCookieOptions(true, undefined);

      expect(result.maxAge).toBeUndefined();
    });
  });
});
