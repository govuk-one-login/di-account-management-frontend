import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextFunction, Request, Response } from "express";
import { validateStateMiddleware } from "../../../src/middleware/validate-state-middleware.js";
import { PATH_DATA } from "../../../src/app.constants.js";

describe("validate state middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  const info: ReturnType<typeof vi.fn> = vi.fn();
  const warn: ReturnType<typeof vi.fn> = vi.fn();

  beforeEach(() => {
    next = vi.fn(() => {});

    req = {
      url: "/choose-backup",
      path: "/choose-backup",
      body: {},
      query: {},
      session: {
        user: {
          email: "test@example.com",
          tokens: { accessToken: "dummytoken" },
          state: {
            addBackup: { value: "CHNAGE_VALUE", events: ["SELECTED_APP"] },
          },
        },
      } as any,
      oidc: { authorizationUrl: vi.fn(), metadata: {} as any } as any,
      log: {
        info,
        warn,
      } as any,
    };
    res = {
      render: vi.fn(),
      redirect: vi.fn(() => {}),
      locals: { trace: {} },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should continue to next middleware and pass validation", () => {
    res.locals.sessionId = "sessionId";
    res.locals.persistentSessionId = "persistentSessionId";

    validateStateMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it("should redirect to your services when state does not exist for page type", () => {
    req.session.user.state = {};

    validateStateMiddleware(req as Request, res as Response, next);

    expect(info).toHaveBeenCalledWith(
      "state exists but no value for addBackup"
    );
    expect(warn).toHaveBeenCalledWith(
      "state exists but no value for addBackup"
    );
    expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.YOUR_SERVICES.url);
    expect(next).not.toHaveBeenCalled();
  });

  it("should redirect to your services when required event is not in events array", () => {
    req.session.user.state = {
      addBackup: { value: "CHANGE_VALUE", events: ["WRONG_EVENT"] },
    };

    validateStateMiddleware(req as Request, res as Response, next);

    expect(req.session.user.state.addBackup).toBeUndefined();
    expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.YOUR_SERVICES.url);
    expect(next).not.toHaveBeenCalled();
  });

  it("should continue when events array is empty", () => {
    req.session.user.state = {
      addBackup: { value: "CHANGE_VALUE", events: [] },
    };

    validateStateMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
