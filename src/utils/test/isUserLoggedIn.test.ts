import { describe, it, expect, beforeEach } from "vitest";
import { Request } from "express";
import isUserLoggedIn from "../isUserLoggedIn.js";

describe("isUserLoggedIn", () => {
  let req: Partial<Request>;

  beforeEach(() => {
    req = {
      session: {
        user: {
          isAuthenticated: false,
        },
      } as any,
      cookies: {},
    };
  });

  it("should return false if the user is not authenticated", () => {
    req.session.user.isAuthenticated = false;
    expect(isUserLoggedIn(req as Request)).toBe(false);
  });

  it("should return true if the user is authenticated and not logged out", () => {
    req.session.user.isAuthenticated = true;
    expect(isUserLoggedIn(req as Request)).toBe(true);
  });

  it("should return false if the user is authenticated but logged out", () => {
    req.session.user.isAuthenticated = true;
    req.cookies.lo = JSON.stringify(true);
    expect(isUserLoggedIn(req as Request)).toBe(false);
  });

  it("should return true if the user is authenticated and lo cookie is false", () => {
    req.session.user.isAuthenticated = true;
    req.cookies.lo = JSON.stringify(false);
    expect(isUserLoggedIn(req as Request)).toBe(true);
  });

  it("should return false if there is no session", () => {
    req.session = undefined;
    expect(isUserLoggedIn(req as Request)).toBe(false);
  });

  it("should return false if there is no user in session", () => {
    req.session.user = undefined;
    expect(isUserLoggedIn(req as Request)).toBe(false);
  });
});
