import { describe, it, expect } from "vitest";
import { convertPageQueryStringToNumber } from "./convertPageQueryStringToNumber.js"; // Update with your actual file path

describe("convertPageQueryStringToNumber", () => {
  describe("valid query string", () => {
    it("should return the number for a valid positive integer string", () => {
      expect(convertPageQueryStringToNumber("1")).toBe(1);
      expect(convertPageQueryStringToNumber("42")).toBe(42);
    });
  });

  describe("decimals", () => {
    it("should return undefined for strings containing a decimal point", () => {
      expect(convertPageQueryStringToNumber("1.5")).toBeUndefined();
      expect(convertPageQueryStringToNumber("0.1")).toBeUndefined();
      expect(convertPageQueryStringToNumber(".5")).toBeUndefined();
    });
  });

  describe("zero and negative numbers", () => {
    it("should return undefined for zero", () => {
      expect(convertPageQueryStringToNumber("0")).toBeUndefined();
    });

    it("should return undefined for negative integers", () => {
      expect(convertPageQueryStringToNumber("-1")).toBeUndefined();
      expect(convertPageQueryStringToNumber("-42")).toBeUndefined();
    });
  });

  describe("non numeric strings", () => {
    it("should return undefined for completely non-numeric strings", () => {
      expect(convertPageQueryStringToNumber("abc")).toBeUndefined();
      expect(convertPageQueryStringToNumber("")).toBeUndefined();
    });

    it("should return undefined for strings that start with characters", () => {
      expect(convertPageQueryStringToNumber("page-2")).toBeUndefined();
    });

    it("should return a number if it starts with digits but ends with characters", () => {
      expect(convertPageQueryStringToNumber("2abc")).toBeUndefined();
    });
  });
});
