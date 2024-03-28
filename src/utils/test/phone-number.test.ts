import { assert } from "chai";
import { describe } from "mocha";
import { getLastNDigits } from "../phone-number";
describe("getLastNDigits", () => {
  it("should return last n digits", () => {
    const phoneNumber = "1234567890";
    const expected = "7890";
    assert.equal(getLastNDigits(phoneNumber, 4), expected);
  });

  it("should return null if phone number is missing", () => {
    assert.equal(getLastNDigits(null, 4), "");
  });

  it("should return null if n is less than 1", () => {
    const phoneNumber = "1234567890";
    assert.equal(getLastNDigits(phoneNumber, 0), "");
  });
});
