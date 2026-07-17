import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { conditionalMfaMethodMiddleware } from "../security-routes.js";
import * as config from "../../../config.js";
import * as mfaMiddleware from "../../../middleware/mfa-method-middleware.js";

describe("conditionalMfaMethodMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {};
    next = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call next directly when passkeys are enabled", async () => {
    vi.spyOn(config, "passkeysEnabled").mockReturnValue(true);
    const mfaMethodMiddlewareSpy = vi.spyOn(
      mfaMiddleware,
      "mfaMethodMiddleware"
    );

    await conditionalMfaMethodMiddleware(req as Request, res as Response, next);

    expect(config.passkeysEnabled).toHaveBeenCalledWith(req);
    expect(next).toHaveBeenCalledOnce();
    expect(mfaMethodMiddlewareSpy).not.toHaveBeenCalled();
  });

  it("should call mfaMethodMiddleware when passkeys are disabled", async () => {
    vi.spyOn(config, "passkeysEnabled").mockReturnValue(false);
    const mfaMethodMiddlewareSpy = vi
      .spyOn(mfaMiddleware, "mfaMethodMiddleware")
      .mockResolvedValue();

    await conditionalMfaMethodMiddleware(req as Request, res as Response, next);

    expect(config.passkeysEnabled).toHaveBeenCalledWith(req);
    expect(mfaMethodMiddlewareSpy).toHaveBeenCalledWith(req, res, next);
  });
});
