import { describe, it, expect } from "vitest";
import { detectOidcError } from "../detect-oidc-error.js";

describe("detectOidcError", () => {
  it("should detect access_denied error", () => {
    const result = detectOidcError(new Error("access_denied"));
    expect(result).toEqual({ type: "access_denied", message: "access_denied" });
  });

  it("should detect invalid_grant error", () => {
    const result = detectOidcError(
      new Error("invalid_grant: refresh token expired")
    );
    expect(result).toEqual({
      type: "invalid_grant",
      message: "invalid_grant: refresh token expired",
    });
  });

  it("should detect id_token not present in TokenSet", () => {
    const result = detectOidcError(
      new Error("id_token not present in TokenSet")
    );
    expect(result).toEqual({
      type: "id_token_missing",
      message: "id_token not present in TokenSet",
    });
  });

  it("should detect state mismatch error (exact phrase)", () => {
    const result = detectOidcError(new Error("state mismatch"));
    expect(result).toEqual({
      type: "state_mismatch",
      message: "state mismatch",
    });
  });

  it("should detect state mismatch error with custom text", () => {
    const result = detectOidcError(
      new Error("state mismatch, expected 1QSyrvAQ6tUjzg, got: p8OW9hwuyFBuhA")
    );
    expect(result).toEqual({
      type: "state_mismatch",
      message: "state mismatch, expected 1QSyrvAQ6tUjzg, got: p8OW9hwuyFBuhA",
    });
  });

  it("should detect unauthorized response", () => {
    const result = detectOidcError(new Error("200 OK, got: 401 Unauthorized"));
    expect(result).toEqual({
      type: "unauthorized_response",
      message: "200 OK, got: 401 Unauthorized",
    });
  });

  it("should return null for unknown errors", () => {
    const result = detectOidcError(new Error("some other random error"));
    expect(result).toEqual(null);
  });

  it("should handle string errors", () => {
    const result = detectOidcError("access_denied");
    expect(result).toEqual({
      type: "access_denied",
      message: "access_denied",
    });
  });

  it("should return null for null input", () => {
    const result = detectOidcError(null);
    expect(result).toEqual(null);
  });
});
