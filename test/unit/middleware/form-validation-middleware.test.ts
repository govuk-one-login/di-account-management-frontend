import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextFunction, Request, Response } from "express";
// import { sinon } from "../../utils/test-utils.js";
import {
  validateBodyMiddleware,
  validationErrorFormatter,
} from "../../../src/middleware/form-validation-middleware.js";

describe("HTML Lang middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      i18n: { language: "en" } as any,
    };
    res = { locals: {} };
    next = vi.fn(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("validationErrorFormatter", () => {
    it("should format error message", () => {
      const error = {
        type: "field",
        path: "path",
        location: "body",
        msg: "error message",
      } as any;

      const formattedError = validationErrorFormatter(error);

      expect(formattedError).toEqual({
        text: error.msg,
        href: `#${error.path}`,
      });
    });
  });

  describe("validateBodyMiddleware", () => {
    it("should validate request", () => {
      validateBodyMiddleware("test.html")(
        req as Request,
        res as Response,
        next
      );
      expect(next).toHaveBeenCalled();
    });

    it("should call next function", () => {
      validateBodyMiddleware("test.html")(
        req as Request,
        res as Response,
        next
      );
      expect(next).toHaveBeenCalled();
    });
  });
});
