import { detectOidcError, OidcErrorType } from "../detect-oidc-error";
import { describe } from "mocha";
import { expect } from "chai";

describe("detectOidcError", () => {
  const testCases: {
    description: string;
    input: unknown;
    expected: { type: OidcErrorType; message: string } | null;
  }[] = [
    {
      description: "should detect access_denied error",
      input: new Error("access_denied"),
      expected: { type: "access_denied", message: "access_denied" },
    },
    {
      description: "should detect invalid_grant error",
      input: new Error("invalid_grant: refresh token expired"),
      expected: {
        type: "invalid_grant",
        message: "invalid_grant: refresh token expired",
      },
    },
    {
      description: "should detect id_token not present in TokenSet",
      input: new Error("id_token not present in TokenSet"),
      expected: {
        type: "id_token_missing",
        message: "id_token not present in TokenSet",
      },
    },
    {
      description: "should detect state mismatch error (exact phrase)",
      input: new Error("state mismatch"),
      expected: {
        type: "state_mismatch",
        message: "state mismatch",
      },
    },
    {
      description: "should detect state mismatch error with custom text",
      input: new Error(
        "state mismatch, expected 1QSyrvAQ6tUjzg, got: p8OW9hwuyFBuhA"
      ),
      expected: {
        type: "state_mismatch",
        message: "state mismatch, expected 1QSyrvAQ6tUjzg, got: p8OW9hwuyFBuhA",
      },
    },
    {
      description: "should detect unauthorized response",
      input: new Error("200 OK, got: 401 Unauthorized"),
      expected: {
        type: "unauthorized_response",
        message: "200 OK, got: 401 Unauthorized",
      },
    },
    {
      description: "should return null for unknown errors",
      input: new Error("some other random error"),
      expected: null,
    },
    {
      description: "should handle string errors",
      input: "access_denied",
      expected: {
        type: "access_denied",
        message: "access_denied",
      },
    },
    {
      description: "should return null for null input",
      input: null,
      expected: null,
    },
  ];

  testCases.forEach(({ description, input, expected }) => {
    it(description, () => {
      const result = detectOidcError(input);
      expect(result).to.deep.eq(expected);
    });
  });
});
