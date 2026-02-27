import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { logErrorMiddleware } from "../../../src/middleware/log-error-middleware.js";
import * as shouldLogErrorModule from "../../../src/utils/shouldLogError.js";

describe("logErrorMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let shouldLogErrorStub: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    req = {
      log: {
        error: vi.fn(),
      },
    } as any;
    res = {};
    next = vi.fn();
    shouldLogErrorStub = vi.spyOn(shouldLogErrorModule, "shouldLogError");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should log error when shouldLogError returns true", () => {
    const error = new Error("Test error");
    shouldLogErrorStub.mockReturnValue(true);

    logErrorMiddleware(error, req as Request, res as Response, next);

    expect(shouldLogErrorStub).toHaveBeenCalledOnce();
    expect(shouldLogErrorStub).toHaveBeenCalledWith(error);
    expect(req.log.error).toHaveBeenCalledOnce();
    expect(req.log.error).toHaveBeenCalledWith(error, "Test error");
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(error);
  });

  it("should not log error when shouldLogError returns false", () => {
    const error = new Error("Test error");
    shouldLogErrorStub.mockReturnValue(false);

    logErrorMiddleware(error, req as Request, res as Response, next);

    expect(shouldLogErrorStub).toHaveBeenCalledOnce();
    expect(shouldLogErrorStub).toHaveBeenCalledWith(error);
    expect(req.log.error).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(error);
  });

  it("should handle non-Error objects", () => {
    const error = "string error";
    shouldLogErrorStub.mockReturnValue(true);

    logErrorMiddleware(error, req as Request, res as Response, next);

    expect(shouldLogErrorStub).toHaveBeenCalledOnce();
    expect(shouldLogErrorStub).toHaveBeenCalledWith(error);
    expect(req.log.error).toHaveBeenCalledOnce();
    expect(req.log.error).toHaveBeenCalledWith(error, undefined);
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(error);
  });
});
