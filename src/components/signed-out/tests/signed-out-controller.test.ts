import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { signedOutGet } from "../signed-out-controller.js";

describe("signed out controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      render: vi.fn(),
      status: vi.fn(),
      locals: {},
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("signedOutGet", () => {
    it("should return signed out page", () => {
      signedOutGet(req as Request, res as Response);

      expect(res.render).toHaveBeenCalledWith("signed-out/index.njk", {
        hideAccountNavigation: true,
        signinLink: "/",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
