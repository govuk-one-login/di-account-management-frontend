import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextFunction, Request, Response } from "express";
import { csrfErrorHandler } from "../../../src/handlers/csrf-error-handler.js";
import { PATH_DATA } from "../../../src/app.constants.js";

describe("csrf-error-handler", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      log: {
        info: vi.fn(),
      },
    } as Partial<Request>;
    res = {
      redirect: vi.fn(() => {}),
      headersSent: false,
    };
    next = vi.fn(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("csrfErrorHandler", () => {
    it("should call next when headers already sent", () => {
      res.headersSent = true;
      const error = { code: "EBADCSRFTOKEN" };

      csrfErrorHandler(error, req as Request, res as Response, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it("should redirect to your services page when CSRF token is invalid", () => {
      const error = { code: "EBADCSRFTOKEN", message: "invalid csrf token" };

      csrfErrorHandler(error, req as Request, res as Response, next);

      expect((req as any).log.info).toHaveBeenCalledOnce();
      expect((req as any).log.info).toHaveBeenCalledWith({
        msg: "Failed CSRF validation, redirecting to your services page.  Original error: invalid csrf token",
      });
      expect(res.redirect).toHaveBeenCalledOnce();
      expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.YOUR_SERVICES.url);
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with error when error code is not EBADCSRFTOKEN", () => {
      const error = { code: "OTHER_ERROR", message: "some other error" };

      csrfErrorHandler(error, req as Request, res as Response, next);

      expect(next).toHaveBeenCalledOnce();
      expect(next).toHaveBeenCalledWith(error);
      expect(res.redirect).not.toHaveBeenCalled();
      expect((req as any).log.info).not.toHaveBeenCalled();
    });
  });
});
