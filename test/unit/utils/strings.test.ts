import { beforeEach, describe, it, expect, vi, afterEach } from "vitest";
import {
  containsNumber,
  containsNumbersOnly,
  generateNonce,
  isSafeString,
  isValidUrl,
  zeroPad,
} from "../../../src/utils/strings.js";
// import { sinon } from "../../utils/test-utils.js";
import { logger } from "../../../src/utils/logger.js";

describe("string-helpers", () => {
  describe("containsNumber", () => {
    it("should return false when string contains no numeric characters", () => {
      expect(containsNumber("test")).toBe(false);
    });

    it("should return false when string is empty in containsNumber", () => {
      expect(containsNumber("")).toBe(false);
    });

    it("should return false when string is null in containerNumber", () => {
      expect(containsNumber(null)).toBe(false);
    });

    it("should return true when string contains numeric characters", () => {
      expect(containsNumber("test123")).toBe(true);
    });
  });

  describe("hasNumbersOnly", () => {
    it("should return false when string contains text characters", () => {
      expect(containsNumbersOnly("test")).toBe(false);
    });

    it("should return false when string is empty", () => {
      expect(containsNumbersOnly("")).toBe(false);
    });

    it("should return false when string is null", () => {
      expect(containsNumbersOnly(null)).toBe(false);
    });

    it("should return false when string contains alphanumeric characters", () => {
      expect(containsNumbersOnly("test123456")).toBe(false);
    });

    it("should return true when string contains numeric characters only", () => {
      expect(containsNumbersOnly("123456")).toBe(true);
    });
  });

  describe("isValidUrl", () => {
    let loggerWarnSpy: ReturnType<typeof vi.fn>;
    // Optional: Utility function to generate test URLs
    function generateTestUrls(baseUrl: string, iterations = 5): string[] {
      const urls: string[] = [baseUrl];
      for (let i = 1; i <= iterations; i++) {
        const url = new URL(urls[i - 1]);
        url.searchParams.set("fromURL", encodeURIComponent(urls[i - 1]));
        urls.push(url.toString());
      }
      return urls;
    }

    beforeEach(() => {
      loggerWarnSpy = vi.spyOn(logger, "warn");
    });

    afterEach(() => {
      loggerWarnSpy.mockRestore();
    });

    it("should return true if valid", () => {
      expect(isValidUrl("www.home.account.gov.uk")).toBe(false);
      expect(isValidUrl("home.account.gov.uk")).toBe(false);
      expect(isValidUrl("https://home.account.gov.uk")).toBe(true);
      expect(isValidUrl("https://home.account.gov.uk/security")).toBe(true);
      expect(
        isValidUrl("https://home.account.gov.uk/security?foo=bar&bar=foo")
      ).toBe(true);
      expect(loggerWarnSpy).toHaveBeenCalledTimes(2);
    });

    it("should return false if url is invalid", () => {
      expect(isValidUrl("")).toBe(false);
      expect(isValidUrl("1")).toBe(false);
      expect(isValidUrl("qwerty")).toBe(false);
      expect(isValidUrl("qwerty.gov.&^")).toBe(false);
      expect(isValidUrl("https:///home.account.gov.uk")).toBe(true);
      expect(loggerWarnSpy).toHaveBeenCalledTimes(3);
    });

    it("should return true if string is safe is invalid", () => {
      expect(isValidUrl("")).toBe(false);
      expect(isValidUrl("1")).toBe(false);
      expect(isValidUrl("qwerty")).toBe(false);
      expect(isValidUrl("qwerty.gov.&^")).toBe(false);
      expect(isValidUrl("https:///home.account.gov.uk")).toBe(true);
      expect(isValidUrl("http://localhost:6001")).toBe(false);
      expect(loggerWarnSpy).toHaveBeenCalledTimes(3);
    });

    const testUrls = generateTestUrls("https://www.example.com?start=1", 3);
    testUrls.forEach((url, index) => {
      it(`should handle generated URL level ${index}`, () => {
        const result = isValidUrl(url);
        expect(result).toBe(true);
      });
    });
  });

  describe("isSafeString", () => {
    it("letters numbers hyphens and underscores should be accepted", () => {
      expect(isSafeString("hEllo-12_3")).toBe(true);
    });

    it("should return false if contains special characters", () => {
      expect(isSafeString("hEllo***")).toBe(false);
    });

    it("should return false if over 50 characters", () => {
      expect(
        isSafeString("qqqqqqqqqqaaaaaaaaaahhhhhhhhhhhddddddddddooooooooooojjj")
      ).toBe(false);
    });
  });

  describe("zeroPad", () => {
    it("should return a string of the correct length", () => {
      const expectedLength = 6;
      expect(zeroPad("abc", expectedLength).length).toBe(expectedLength);
    });

    it("should pad a short string with zeros", () => {
      expect(zeroPad("123", 6)).toBe("000123");
    });
  });

  describe("generateNonce", () => {
    it("should generate a 32-character hexadecimal nonce", async () => {
      const nonce = await generateNonce();
      expect(nonce).toBeTypeOf("string");
      expect(nonce).toHaveLength(32);
      expect(nonce).toMatch(/^[0-9a-f]+$/);
    });

    it("should generate unique nonces", async () => {
      const nonce1 = await generateNonce();
      const nonce2 = await generateNonce();
      expect(nonce1).not.toBe(nonce2);
    });
  });
});
