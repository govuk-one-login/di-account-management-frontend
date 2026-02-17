import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { validateChooseBackupRequest } from "../choose-backup-validation.js";

describe("validateaddBackupRequest", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let nextSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    req = {
      body: {},
      session: {} as any,
      t: vi.fn().mockReturnValue("Error message"),
    };
    res = {
      render: vi.fn(),
    };
    nextSpy = vi.fn();
    next = nextSpy;
  });

  it("should return an array with two middleware functions", () => {
    const middlewareArray = validateChooseBackupRequest();
    expect(middlewareArray).toBeTypeOf("object");
    expect(middlewareArray).toHaveLength(2);
    expect(middlewareArray[0]).toBeTypeOf("function");
    expect(middlewareArray[1]).toBeTypeOf("function");
  });

  it("should validate 'addBackup' field is not empty", async () => {
    const [validationMiddleware] = validateChooseBackupRequest();
    req.body.addBackup = ""; // Simulate an empty input

    await (validationMiddleware as any)(req, res, next);

    const errors = validationResult(req as Request);
    expect(errors.isEmpty()).toBe(false);
    expect(errors.array()[0].msg).toBe("Error message");
  });

  it("should call next() if no validation errors", () => {
    const [, handleValidationErrors] = validateChooseBackupRequest();

    handleValidationErrors(req as Request, res as Response, next);

    expect(nextSpy).toHaveBeenCalledOnce();
  });
});
