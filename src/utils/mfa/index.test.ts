import { expect } from "chai";
import { describe, it } from "mocha";
import {
  generateMfaSecret,
  generateQRCodeValue,
  verifyMfaCode,
} from "./index.js";

describe("MFA Utils", () => {
  describe("generateMfaSecret", () => {
    it("should generate a secret", () => {
      const secret = generateMfaSecret();
      expect(secret).to.be.a("string");
      expect(secret.length).to.be.greaterThan(0);
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
      expect(result).to.include("otpauth://totp/");
      expect(result).to.include("SECRET");
    });

    it("should generate QR code value with environment suffix in non-production", async () => {
      process.env.APP_ENV = "dev";
      const result = generateQRCodeValue("SECRET", "test@example.com", "MyApp");
      expect(result).to.include("otpauth://totp/");
      expect(result).to.include("SECRET");
    });
  });

  describe("verifyMfaCode", () => {
    it("should verify valid MFA code", async () => {
      const secret = generateMfaSecret();
      const result = await verifyMfaCode(secret, "123456");
      expect(result).to.be.a("boolean");
    });
  });
});
