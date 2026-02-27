import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextFunction } from "express";
// import { sinon } from "../../utils/test-utils.js";
import { isUserLoggedInMiddleware } from "../../../src/middleware/is-user-logged-in-middleware.js";

describe("isUserLoggedInMiddleware", () => {
  let req: any;
  const res: any = { locals: {}, redirect: vi.fn() };
  const nextFunction: NextFunction = vi.fn(() => {});

  beforeEach(() => {
    req = {
      session: {
        user: {
          isAuthenticated: false,
        } as any,
      },
      cookies: {
        lo: "true",
      },
    };
  });

  it("should set isUserLoggedIn in res.locals", () => {
    isUserLoggedInMiddleware(req, res, nextFunction);
    expect(res.locals).toHaveProperty("isUserLoggedIn");
  });

  it("should call next function", () => {
    isUserLoggedInMiddleware(req, res, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });
});
