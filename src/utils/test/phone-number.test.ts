import { describe, it, expect } from "vitest";
import { getLastNDigits } from "../phone-number.js";

describe("getLastNDigits", () => {
  it("should return last n digits", () => {
    const phoneNumber = "1234567890";
    const expected = "7890";
    expect(getLastNDigits(phoneNumber, 4)).toBe(expected);
  });

  it("should return null if phone number is missing", () => {
    expect(getLastNDigits(null, 4)).toBe("");
  });

  it("should return null if n is less than 1", () => {
    const phoneNumber = "1234567890";
    expect(getLastNDigits(phoneNumber, 0)).toBe("");
  });
});
