import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextFunction, Request, Response } from "express";
import { sanitizeRequestMiddleware } from "../../../src/middleware/sanitize-request-middleware.js";
// import { expect, sinon } from "../../utils/test-utils.js";

describe("sanitize-request-middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { body: {} };
    res = {};
    next = vi.fn(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("sanitizeRequestMiddleware", () => {
    it("should not change input when no xss present", () => {
      req = {
        body: {
          name: "Test123",
        },
      } as Request;

      sanitizeRequestMiddleware(req as Request, res as Response, next);

      expect(req.body.name).toEqual("Test123");
      expect(next).toHaveBeenCalled();
    });

    it("should remove entire script block returning an empty string", () => {
      req = {
        body: {
          name: "<SCRIPT SRC=http://xss.rocks/xss.js></SCRIPT>",
        },
      } as Request;

      sanitizeRequestMiddleware(req as Request, res as Response, next);

      expect(req.body.name).toEqual("");
      expect(next).toHaveBeenCalled();
    });

    it("should remove entire input returning an empty string", () => {
      req = {
        body: {
          name: '<INPUT TYPE="IMAGE" SRC="javascript:alert(\'XSS\');">',
        },
      } as Request;

      sanitizeRequestMiddleware(req as Request, res as Response, next);

      expect(req.body.name).toEqual("");
      expect(next).toHaveBeenCalled();
    });

    it("handles multiple fields", () => {
      req = {
        body: {
          name: "Test12",
          email: "test@test.com",
        },
      } as Request;

      sanitizeRequestMiddleware(req as Request, res as Response, next);

      expect(req.body.name).toEqual("Test12");
      expect(req.body.email).toEqual("test@test.com");
      expect(next).toHaveBeenCalled();
    });

    it("should trim whitespace from form field", () => {
      req = {
        body: {
          name: "    James Mc'oy \n\t",
        },
      } as Request;

      sanitizeRequestMiddleware(req as Request, res as Response, next);

      expect(req.body.name).toEqual("James Mc'oy");
      expect(next).toHaveBeenCalled();
    });
  });
});
