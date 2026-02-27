import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextFunction, Request, Response } from "express";
import { noCacheMiddleware } from "../../../src/middleware/no-cache-middleware.js";

describe("no-cache-middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {} as Partial<Request>;
    res = {
      set: vi.fn(),
    };
    next = vi.fn(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("noCacheMiddleware", () => {
    it("should set Cache-Control header with no-cache directives", () => {
      noCacheMiddleware(req as Request, res as Response, next);

      expect(res.set).toHaveBeenCalledOnce();
      expect(res.set).toHaveBeenCalledWith(
        "Cache-Control",
        "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
      );
      expect(next).toHaveBeenCalledOnce();
    });
  });
});
