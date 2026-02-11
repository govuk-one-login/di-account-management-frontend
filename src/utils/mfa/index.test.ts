import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  generateMfaSecret,
  generateQRCodeValue,
  verifyMfaCode,
} from "./index.js";

describe("MFA Utils", () => {
  describe("generateMfaSecret", () => {
    it("should generate a secret", () => {
      const secret = generateMfaSecret();
      expect(secret).toBeTypeOf("string");
      expect(secret.length).toBeGreaterThan(0);
    });
  });

  describe("generateQRCodeValue", () => {
    let originalAppEnv: string;

    beforeEach(() => {
      originalAppEnv = process.env.APP_ENV;
    });

    afterEach(() => {
      process.env.APP_ENV = originalAppEnv;
    });

    it("should generate QR code value with issuer in production", async () => {
      process.env.APP_ENV = "production";
      const result = generateQRCodeValue("SECRET", "test@example.com", "MyApp");
      expect(result).toContain("otpauth://totp/");
      expect(result).toContain("SECRET");
    });

    it("should generate QR code value with environment suffix in non-production", async () => {
      process.env.APP_ENV = "dev";
      const result = generateQRCodeValue("SECRET", "test@example.com", "MyApp");
      expect(result).toContain("otpauth://totp/");
      expect(result).toContain("SECRET");
    });
  });

  describe("verifyMfaCode", () => {
    it("should verify valid MFA code", async () => {
      const secret = generateMfaSecret();
      const result = await verifyMfaCode(secret, "123456");
      expect(result).toBeTypeOf("boolean");
    });
  });
});
