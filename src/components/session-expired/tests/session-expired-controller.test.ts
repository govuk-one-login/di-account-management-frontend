import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { sessionExpiredGet } from "../session-expired-controller.js";

describe("session expired controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: {},
      session: { user: vi.fn() } as any,
      oidc: { authorizationUrl: vi.fn(), metadata: {} as any } as any,
    };
    res = {
      render: vi.fn(),
      redirect: vi.fn(() => {}),
      locals: {},
      status: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("sessionExpiredGet", () => {
    it("should return session expired page", () => {
      sessionExpiredGet(req as Request, res as Response);

      expect(res.render).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
