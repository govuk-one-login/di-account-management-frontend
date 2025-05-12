import { assert } from "chai";
import { describe } from "mocha";
import { getLastNDigits, phoneNumberInUse } from "../phone-number";

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

describe("phoneNumberInUse", () => {
  it("should return false when the phone numebr is not already in use", () => {
    assert.equal(
      phoneNumberInUse("0129384756", [
        {
          mfaIdentifier: "1",
          priorityIdentifier: "DEFAULT",
          method: { mfaMethodType: "SMS", phoneNumber: "0123456789" },
          methodVerified: true,
        },
        {
          mfaIdentifier: "2",
          priorityIdentifier: "BACKUP",
          method: { mfaMethodType: "SMS", phoneNumber: "99940850934" },
          methodVerified: true,
        },
      ]),
      false
    );
  });

  it("should return true when the phone numebr is already in use", () => {
    assert.equal(
      phoneNumberInUse("99940850934", [
        {
          mfaIdentifier: "1",
          priorityIdentifier: "DEFAULT",
          method: { mfaMethodType: "SMS", phoneNumber: "0123456789" },
          methodVerified: true,
        },
        {
          mfaIdentifier: "2",
          priorityIdentifier: "BACKUP",
          method: { mfaMethodType: "SMS", phoneNumber: "99940850934" },
          methodVerified: true,
        },
      ]),
      true
    );
  });
});
