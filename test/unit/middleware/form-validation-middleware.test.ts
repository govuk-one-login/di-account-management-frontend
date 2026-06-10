import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextFunction, Request, Response } from "express";
import {
  validateBodyMiddleware,
  validationErrorFormatter,
} from "../../../src/middleware/form-validation-middleware.js";
import { validationResult } from "express-validator";
import {
  isObjectEmpty,
  renderBadRequest,
} from "../../../src/utils/validation.js";

vi.mock("express-validator", () => ({
  validationResult: vi.fn(),
}));

vi.mock("../../../src/utils/validation.js", () => ({
  isObjectEmpty: vi.fn(),
  renderBadRequest: vi.fn(),
}));

describe("HTML Lang middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mockFormatWith: any;
  let mockMapped: any;

  beforeEach(() => {
    req = {
      i18n: { language: "en" } as any,
    };
    res = { locals: {} };
    next = vi.fn(() => {});

    mockMapped = vi.fn();
    mockFormatWith = vi.fn(() => ({ mapped: mockMapped }));
    vi.mocked(validationResult).mockReturnValue({
      formatWith: mockFormatWith,
    } as any);
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
      mockMapped.mockReturnValue({});
      vi.mocked(isObjectEmpty).mockReturnValue(true);

      validateBodyMiddleware("test.html")(
        req as Request,
        res as Response,
        next
      );
      expect(next).toHaveBeenCalled();
    });

    it("should call next function", () => {
      mockMapped.mockReturnValue({});
      vi.mocked(isObjectEmpty).mockReturnValue(true);

      validateBodyMiddleware("test.html")(
        req as Request,
        res as Response,
        next
      );
      expect(next).toHaveBeenCalled();
    });

    describe("when validation errors exist", () => {
      const mockErrors = { username: { text: "Required", href: "#username" } };

      beforeEach(() => {
        mockMapped.mockReturnValue(mockErrors);
        vi.mocked(isObjectEmpty).mockReturnValue(false);
      });

      it("should resolve object options and render bad request", () => {
        const staticOptions = { csrfToken: "123" };

        validateBodyMiddleware("test.html", staticOptions)(
          req as Request,
          res as Response,
          next
        );

        expect(next).not.toHaveBeenCalled();
        expect(renderBadRequest).toHaveBeenCalledWith(
          res,
          req,
          "test.html",
          mockErrors,
          staticOptions
        );
      });

      it("should execute function options passing req and render bad request", () => {
        const dynamicOptionsSpy = vi.fn(() => ({ myKey: "myValue" }));

        validateBodyMiddleware("test.html", dynamicOptionsSpy)(
          req as Request,
          res as Response,
          next
        );

        expect(dynamicOptionsSpy).toHaveBeenCalledWith(req);
        expect(next).not.toHaveBeenCalled();
        expect(renderBadRequest).toHaveBeenCalledWith(
          res,
          req,
          "test.html",
          mockErrors,
          { myKey: "myValue" }
        );
      });
    });
  });
});
