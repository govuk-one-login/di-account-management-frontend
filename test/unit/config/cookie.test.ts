import { describe, it, expect } from "vitest";
import { getSessionCookieOptions } from "../../../src/config/cookie.js";

describe("cookie config", () => {
  describe("getSessionCookieOptions", () => {
    it("should return cookie options with secure true in production environment", () => {
      const isProdEnv = true;
      const expiry = 3600000;
      const secret = "test-secret"; //pragma: allowlist secret

      const result = getSessionCookieOptions(isProdEnv, expiry, secret);

      expect(result).toEqual({
        name: "ams",
        secret: "test-secret", //pragma: allowlist secret
        maxAge: 3600000,
        secure: true,
      });
    });

    it("should return cookie options with secure false in non-production environment", () => {
      const isProdEnv = false;
      const expiry = 3600000;
      const secret = "test-secret"; //pragma: allowlist secret

      const result = getSessionCookieOptions(isProdEnv, expiry, secret);

      expect(result).toEqual({
        name: "ams",
        secret: "test-secret", //pragma: allowlist secret
        maxAge: 3600000,
        secure: false,
      });
    });

    it("should handle different expiry values", () => {
      const isProdEnv = true;
      const expiry = 7200000;
      const secret = "test-secret"; //pragma: allowlist secret

      const result = getSessionCookieOptions(isProdEnv, expiry, secret);

      expect(result.maxAge).toBe(7200000);
    });

    it("should handle different secret values", () => {
      const isProdEnv = true;
      const expiry = 3600000;
      const secret = "different-secret-value"; //pragma: allowlist secret

      const result = getSessionCookieOptions(isProdEnv, expiry, secret);

      expect(result.secret).toBe("different-secret-value");
    });

    it("should always set cookie name to ams", () => {
      const result1 = getSessionCookieOptions(true, 3600000, "secret1");
      const result2 = getSessionCookieOptions(false, 7200000, "secret2");

      expect(result1.name).toBe("ams");
      expect(result2.name).toBe("ams");
    });

    it("should handle zero expiry", () => {
      const isProdEnv = true;
      const expiry = 0;
      const secret = "test-secret"; //pragma: allowlist secret

      const result = getSessionCookieOptions(isProdEnv, expiry, secret);

      expect(result.maxAge).toBe(0);
    });

    it("should handle empty secret string", () => {
      const isProdEnv = true;
      const expiry = 3600000;
      const secret = ""; //pragma: allowlist secret

      const result = getSessionCookieOptions(isProdEnv, expiry, secret);

      expect(result.secret).toBe("");
    });
  });
});
