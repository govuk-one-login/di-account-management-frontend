import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextFunction, Request, Response } from "express";
import { mfaMethodMiddleware } from "../../../src/middleware/mfa-method-middleware.js";
import * as mfaClient from "../../../src/utils/mfaClient/index.js";
import { MfaMethod } from "../../../src/utils/mfaClient/types.js";

describe("mfaMethodMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mfaClientStub: any;

  const mfaMethod: MfaMethod = {
    mfaIdentifier: "1",
    priorityIdentifier: "DEFAULT",
    methodVerified: true,
    method: {
      mfaMethodType: "SMS",
      phoneNumber: "0123456789",
    },
  };

  beforeEach(() => {
    next = vi.fn(() => {});
    mfaClientStub = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      retrieve: vi.fn(),
    } as any;
    vi.spyOn(mfaClient, "createMfaClient").mockResolvedValue(mfaClientStub);

    req = {
      session: {} as any,
      log: {
        error: vi.fn(),
      } as any,
    };
    res = {
      render: vi.fn(),
      redirect: vi.fn(() => {}),
      locals: { trace: "trace" },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should set mfaMethods in session on successful retrieval", async () => {
    mfaClientStub.retrieve.mockResolvedValue({
      success: true,
      status: 200,
      data: [mfaMethod],
    });

    await mfaMethodMiddleware(req as Request, res as Response, next);

    expect(req.session.mfaMethods).toEqual([mfaMethod]);
  });

  it("should call next middleware with an error when request to retrieve MFA fails", async () => {
    mfaClientStub.retrieve.mockResolvedValue({
      success: false,
      status: 403,
      error: { message: "Forbidden", code: 1 },
      data: [],
    });

    await mfaMethodMiddleware(req as Request, res as Response, next);
    expect(req.log.error).toHaveBeenCalledOnce();
    expect((next as any).mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it("should call next middleware with an error when mfa retrieval throws an error", async () => {
    mfaClientStub.retrieve.mockRejectedValue(new Error("Test error"));

    await mfaMethodMiddleware(req as Request, res as Response, next);
    expect(req.log.error).toHaveBeenCalledOnce();
    expect((next as any).mock.calls[0][0]).toBeInstanceOf(Error);
  });
});
