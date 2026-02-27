import { describe, it, expect } from "vitest";
import { generateReferenceCode } from "../../../src/utils/referenceCode.js";

describe("referenceCode", () => {
  describe("generateReferenceCode", () => {
    it("should return a string of length 6", () => {
      expect(generateReferenceCode().length).toBe(6);
    });

    it("should return a code with only numbers", () => {
      const code = generateReferenceCode();
      const onlyNumbers = /^\d+$/;
      expect(onlyNumbers.test(code)).toBe(true);
    });
  });
});
