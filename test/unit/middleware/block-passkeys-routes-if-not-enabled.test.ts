import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { blockPasskeyRoutesIfNotEnabled } from "../../../src/middleware/block-passkeys-routes-if-not-enabled.js";
import * as config from "../../../src/config.js";

describe("blockPasskeyRoutesIfNotEnabled middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
    next = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call next when passkeys are enabled", () => {
    vi.spyOn(config, "passkeysEnabled").mockReturnValue(true);

    blockPasskeyRoutesIfNotEnabled(req as Request, res as Response, next);

    expect(config.passkeysEnabled).toHaveBeenCalledWith(req);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  it("should return 404 when passkeys are disabled", () => {
    vi.spyOn(config, "passkeysEnabled").mockReturnValue(false);

    blockPasskeyRoutesIfNotEnabled(req as Request, res as Response, next);

    expect(config.passkeysEnabled).toHaveBeenCalledWith(req);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
  });
});
