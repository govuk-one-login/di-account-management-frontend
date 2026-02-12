import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { healthcheckGet } from "../healthcheck-controller.js";
import { HTTP_STATUS_CODES } from "../../../app.constants";

describe("healthcheck controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("healthcheckGet", () => {
    it("should return 200", () => {
      healthcheckGet(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.OK);
    });
  });
});
