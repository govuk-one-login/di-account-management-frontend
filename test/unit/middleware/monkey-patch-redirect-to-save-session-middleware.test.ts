import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextFunction, Request, Response } from "express";
// import { expect, sinon } from "../../utils/test-utils.js";
import { monkeyPatchRedirectToSaveSessionMiddleware } from "../../../src/middleware/monkey-patch-redirect-to-save-session-middleware.js";
import * as loggerModule from "../../../src/utils/logger.js";

describe("monkey-patch-redirect-to-save-session-middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let originalRedirect: ReturnType<typeof vi.fn>;
  let sessionSave: ReturnType<typeof vi.fn>;
  let loggerWarnStub: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalRedirect = vi.fn();
    sessionSave = vi.fn();
    loggerWarnStub = vi.spyOn(loggerModule.logger, "warn");

    req = {
      path: "/test-path",
      session: {
        save: sessionSave,
      } as any,
    };

    res = {
      redirect: originalRedirect,
      headersSent: false,
      locals: {
        trace: "test-trace-id",
      },
    };

    next = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("monkeyPatchRedirectToSaveSessionMiddleware", () => {
    it("should monkey-patch res.redirect and call next", () => {
      monkeyPatchRedirectToSaveSessionMiddleware(
        req as Request,
        res as Response,
        next
      );

      expect(res.redirect).not.toBe(originalRedirect);
      expect(next).toHaveBeenCalledOnce();
    });

    it("should save session before calling original redirect with string argument", () => {
      sessionSave.mockImplementation((...args) => args[0]());

      monkeyPatchRedirectToSaveSessionMiddleware(
        req as Request,
        res as Response,
        next
      );

      res.redirect("/test-url");

      expect(sessionSave).toHaveBeenCalledOnce();
      expect(originalRedirect).toHaveBeenCalledOnce();
      expect(originalRedirect).toHaveBeenCalledWith("/test-url");
    });

    it("should save session before calling original redirect with status and string arguments", () => {
      sessionSave.mockImplementation((...args) => args[0]());

      monkeyPatchRedirectToSaveSessionMiddleware(
        req as Request,
        res as Response,
        next
      );

      res.redirect(302, "/test-url");

      expect(sessionSave).toHaveBeenCalledOnce();
      expect(originalRedirect).toHaveBeenCalledOnce();
      expect(originalRedirect).toHaveBeenCalledWith(302, "/test-url");
    });

    it("should call original redirect only after session save completes", () => {
      let saveCallback: () => void;
      sessionSave.mockImplementation((callback: () => void) => {
        saveCallback = callback;
      });

      monkeyPatchRedirectToSaveSessionMiddleware(
        req as Request,
        res as Response,
        next
      );

      res.redirect("/test-url");

      expect(originalRedirect).not.toHaveBeenCalled();

      saveCallback();

      expect(originalRedirect).toHaveBeenCalledOnce();
      expect(originalRedirect).toHaveBeenCalledWith("/test-url");
    });

    it("should call original redirect immediately when session is not available", () => {
      req.session = undefined;

      monkeyPatchRedirectToSaveSessionMiddleware(
        req as Request,
        res as Response,
        next
      );

      res.redirect("/test-url");

      expect(sessionSave).not.toHaveBeenCalled();
      expect(originalRedirect).toHaveBeenCalledOnce();
      expect(originalRedirect).toHaveBeenCalledWith("/test-url");
    });

    it("should not redirect and log warning when headers are already sent", () => {
      res.headersSent = true;
      sessionSave.mockImplementation((...args) => args[0]());

      monkeyPatchRedirectToSaveSessionMiddleware(
        req as Request,
        res as Response,
        next
      );

      res.redirect("/test-url");

      expect(originalRedirect).not.toHaveBeenCalled();
      expect(loggerWarnStub).toHaveBeenCalledOnce();
      expect(loggerWarnStub.mock.calls[0][0]).toMatchObject({
        trace: "test-trace-id",
        path: "/test-path",
      });
      expect(loggerWarnStub.mock.calls[0][1]).toBe(
        "Unable to redirect as headers are already sent"
      );
    });

    it("should not redirect when headers are sent even without session", () => {
      req.session = undefined;
      res.headersSent = true;

      monkeyPatchRedirectToSaveSessionMiddleware(
        req as Request,
        res as Response,
        next
      );

      res.redirect("/test-url");

      expect(sessionSave).not.toHaveBeenCalled();
      expect(originalRedirect).not.toHaveBeenCalled();
      expect(loggerWarnStub).toHaveBeenCalledOnce();
      expect(loggerWarnStub.mock.calls[0][0]).toMatchObject({
        trace: "test-trace-id",
        path: "/test-path",
      });
      expect(loggerWarnStub.mock.calls[0][1]).toBe(
        "Unable to redirect as headers are already sent"
      );
    });
  });
});
