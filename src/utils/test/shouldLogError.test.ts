import { expect } from "chai";
import { describe } from "mocha";
import { shouldLogError } from "../shouldLogError";
import { ERROR_MESSAGES } from "../../app.constants";

describe("shouldLogError", () => {
  it("should return false for FAILED_TO_REFRESH_TOKEN errors", () => {
    expect(shouldLogError(new Error(ERROR_MESSAGES.FAILED_TO_REFRESH_TOKEN))).to
      .be.false;
  });

  it("should return true for other errors", () => {
    expect(shouldLogError(new Error("Uh oh"))).to.be.true;
  });

  it("should return true for non-errors", () => {
    expect(shouldLogError("not an error")).to.be.true;
  });
});
