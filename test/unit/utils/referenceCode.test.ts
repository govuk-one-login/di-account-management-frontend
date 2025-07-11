import { expect } from "chai";
import { describe } from "mocha";
import { generateReferenceCode } from "../../../src/utils/referenceCode";

describe("referenceCode", () => {
  describe("generateReferenceCode", () => {
    it("should return a string of length 6", () => {
      expect(generateReferenceCode().length).to.equal(6);
    });

    it("should return a code with only numbers", () => {
      const code = generateReferenceCode();
      const onlyNumbers = /^[0-9]+$/;
      expect(onlyNumbers.test(code)).to.equal(true);
    });
  });
});
