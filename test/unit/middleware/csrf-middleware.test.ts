import { describe, it, expect, vi } from "vitest";
import { csrfMiddleware } from "../../../src/middleware/csrf-middleware.js";
import { NextFunction } from "express";
// import { sinon } from "../../utils/test-utils.js";

describe("CSRF middleware", () => {
  it("should add csrf token to request locals", () => {
    const csrfToken = "a-csrf-token";
    const csrfTokenStub = vi.fn().mockReturnValue(csrfToken);
    const req: any = { csrfToken: csrfTokenStub };
    const res: any = { locals: {} };
    const nextFunction: NextFunction = vi.fn(() => {});

    csrfMiddleware(req, res, nextFunction);

    expect(csrfTokenStub).toHaveBeenCalled();
    expect(res.locals.csrfToken).toBe(csrfToken);
    expect(nextFunction).toHaveBeenCalled();
  });
});
