import { describe, it, expect } from "vitest";
import { shouldLogError } from "../shouldLogError.js";
import { ERROR_MESSAGES } from "../../app.constants";

describe("shouldLogError", () => {
  it("should return false for FAILED_TO_REFRESH_TOKEN errors", () => {
    expect(
      shouldLogError(new Error(ERROR_MESSAGES.FAILED_TO_REFRESH_TOKEN))
    ).toBe(false);
  });

  it("should return true for other errors", () => {
    expect(shouldLogError(new Error("Uh oh"))).toBe(true);
  });

  it("should return true for non-errors", () => {
    expect(shouldLogError("not an error")).toBe(true);
  });
});
