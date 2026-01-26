import { expect } from "chai";
import { describe, it } from "mocha";
import * as sinon from "sinon";
import * as config from "../../config";
import { generateMfaSecret, generateQRCodeValue, verifyMfaCode } from "./index";

describe("MFA Utils", () => {
  describe("generateMfaSecret", () => {
    it("should generate a secret", () => {
      const secret = generateMfaSecret();
      expect(secret).to.be.a("string");
      expect(secret.length).to.be.greaterThan(0);
    });
  });

  describe("generateQRCodeValue", () => {
    afterEach(() => {
      sinon.restore();
    });

    it("should generate QR code value with issuer in production", () => {
      sinon.stub(config, "isProd").returns(true);
      const result = generateQRCodeValue("SECRET", "test@example.com", "MyApp");
      expect(result).to.include("otpauth://totp/");
      expect(result).to.include("SECRET");
    });

    it("should generate QR code value with environment suffix in non-production", () => {
      sinon.stub(config, "isProd").returns(false);
      sinon.stub(config, "getAppEnv").returns("dev");
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
