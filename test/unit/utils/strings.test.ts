import { expect } from "chai";
import { describe } from "mocha";
import {
  containsNumber,
  containsNumbersOnly,
  isSafeString,
  isValidUrl,
  redactPhoneNumber,
  zeroPad,
} from "../../../src/utils/strings";

describe("string-helpers", () => {
  describe("containsNumber", () => {
    it("should return false when string contains no numeric characters", () => {
      expect(containsNumber("test")).to.equal(false);
    });

    it("should return false when string is empty", () => {
      expect(containsNumber("")).to.equal(false);
    });

    it("should return false when string is null", () => {
      expect(containsNumber(null)).to.equal(false);
    });

    it("should return true when string contains numeric characters", () => {
      expect(containsNumber("test123")).to.equal(true);
    });
  });

  describe("hasNumbersOnly", () => {
    it("should return false when string contains text characters", () => {
      expect(containsNumbersOnly("test")).to.equal(false);
    });

    it("should return false when string is empty", () => {
      expect(containsNumbersOnly("")).to.equal(false);
    });

    it("should return false when string is null", () => {
      expect(containsNumbersOnly(null)).to.equal(false);
    });

    it("should return false when string contains alphanumeric characters", () => {
      expect(containsNumbersOnly("test123456")).to.equal(false);
    });

    it("should return true when string contains numeric characters only", () => {
      expect(containsNumbersOnly("123456")).to.equal(true);
    });
  });

  describe("obfuscatePhoneNumber", () => {
    it("should return obfuscated phone number when valid uk phone number", () => {
      expect(redactPhoneNumber("07700900796")).to.equal("*******0796");
    });

    it("should return obfuscated phone number when valid international phone number", () => {
      expect(redactPhoneNumber("+330645453322")).to.equal("*********3322");
    });

    it("should return undefined when phone number is is empty", () => {
      expect(redactPhoneNumber("")).to.equal(undefined);
    });
  });

  describe("isValidUrl", () => {
    it("should return true if valid", () => {
      expect(isValidUrl("www.home.account.gov.uk")).to.be.true;
      expect(isValidUrl("home.account.gov.uk")).to.be.true;
      expect(isValidUrl("https://home.account.gov.uk")).to.be.true;
      expect(isValidUrl("https://home.account.gov.uk/security")).to.be.true;
      expect(isValidUrl("https://home.account.gov.uk/security?foo=bar&bar=foo"))
        .to.be.true;
    });

    it("should return false if url is invalid", () => {
      expect(isValidUrl("")).to.be.false;
      expect(isValidUrl([""])).to.be.false;
      expect(isValidUrl("1")).to.be.false;
      expect(isValidUrl("qwerty")).to.be.false;
      expect(isValidUrl("qwerty.gov.&^")).to.be.false;
      expect(isValidUrl("https:///home.account.gov.uk")).to.be.false;
    });

    it("should return true if string is safe is invalid", () => {
      expect(isValidUrl("")).to.be.false;
      expect(isValidUrl("1")).to.be.false;
      expect(isValidUrl("qwerty")).to.be.false;
      expect(isValidUrl("qwerty.gov.&^")).to.be.false;
      expect(isValidUrl("https:///home.account.gov.uk")).to.be.false;
      expect(isValidUrl("http://localhost:6001")).to.be.false;
    });
  });

  describe("isSafeString", () => {
    it("letters numbers hyphens and underscores should be accepted", () => {
      expect(isSafeString("hEllo-12_3")).to.be.true;
    });

    it("should return false if contains special characters", () => {
      expect(isSafeString("hEllo***")).to.be.false;
    });

    it("should return false if over 50 characters", () => {
      expect(
        isSafeString("qqqqqqqqqqaaaaaaaaaahhhhhhhhhhhddddddddddooooooooooojjj")
      ).to.be.false;
    });
  });

  describe("zeroPad", () => {
    it("should return a string of the correct length", () => {
      const expectedLength = 6;
      expect(zeroPad("abc", expectedLength).length).to.equal(expectedLength);
    });

    it("should pad a short string with zeros", () => {
      expect(zeroPad("123", 6)).to.equal("000123");
    });
  });
});
