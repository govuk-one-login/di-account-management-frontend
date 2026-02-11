import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextFunction, Request, Response } from "express";
// import { sinon } from "../../utils/test-utils";
import { languageToggleMiddleware } from "../../../src/middleware/language-toggle-middleware.js";

describe("lang middleware", () => {
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

  describe("languageToggleMiddleware", () => {
    it("should add language to request locals", () => {
      languageToggleMiddleware(req as Request, res as Response, next);

      expect(res.locals).toHaveProperty("htmlLang");
      expect(next).toHaveBeenCalled();
    });

    it("should call next function", () => {
      req = {};

      languageToggleMiddleware(req as Request, res as Response, next);

      expect(res.locals).not.toHaveProperty("htmlLang");
      expect(next).toHaveBeenCalled();
    });
  });
});
