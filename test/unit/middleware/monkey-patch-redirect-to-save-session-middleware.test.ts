import { NextFunction, Request, Response } from "express";
import { expect, sinon } from "../../utils/test-utils.js";
import { describe } from "mocha";
import { monkeyPatchRedirectToSaveSessionMiddleware } from "../../../src/middleware/monkey-patch-redirect-to-save-session-middleware.js";
import * as loggerModule from "../../../src/utils/logger.js";

describe("monkey-patch-redirect-to-save-session-middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let originalRedirect: sinon.SinonSpy;
  let sessionSave: sinon.SinonStub;
  let loggerWarnStub: sinon.SinonStub;

  beforeEach(() => {
    originalRedirect = sinon.spy();
    sessionSave = sinon.stub();
    loggerWarnStub = sinon.stub(loggerModule.logger, "warn");

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

    next = sinon.spy();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("monkeyPatchRedirectToSaveSessionMiddleware", () => {
    it("should monkey-patch res.redirect and call next", () => {
      monkeyPatchRedirectToSaveSessionMiddleware(
        req as Request,
        res as Response,
        next
      );

      expect(res.redirect).to.not.equal(originalRedirect);
      expect(next).to.have.been.calledOnce;
    });

    it("should save session before calling original redirect with string argument", () => {
      sessionSave.callsArg(0);

      monkeyPatchRedirectToSaveSessionMiddleware(
        req as Request,
        res as Response,
        next
      );

      res.redirect!("/test-url");

      expect(sessionSave).to.have.been.calledOnce;
      expect(originalRedirect).to.have.been.calledOnceWith("/test-url");
    });

    it("should save session before calling original redirect with status and string arguments", () => {
      sessionSave.callsArg(0);

      monkeyPatchRedirectToSaveSessionMiddleware(
        req as Request,
        res as Response,
        next
      );

      res.redirect!(302, "/test-url");

      expect(sessionSave).to.have.been.calledOnce;
      expect(originalRedirect).to.have.been.calledOnceWith(302, "/test-url");
    });

    it("should call original redirect only after session save completes", () => {
      let saveCallback: () => void;
      sessionSave.callsFake((callback: () => void) => {
        saveCallback = callback;
      });

      monkeyPatchRedirectToSaveSessionMiddleware(
        req as Request,
        res as Response,
        next
      );

      res.redirect!("/test-url");

      expect(originalRedirect).to.not.have.been.called;

      saveCallback!();

      expect(originalRedirect).to.have.been.calledOnceWith("/test-url");
    });

    it("should call original redirect immediately when session is not available", () => {
      req.session = undefined;

      monkeyPatchRedirectToSaveSessionMiddleware(
        req as Request,
        res as Response,
        next
      );

      res.redirect!("/test-url");

      expect(sessionSave).to.not.have.been.called;
      expect(originalRedirect).to.have.been.calledOnceWith("/test-url");
    });

    it("should not redirect and log warning when headers are already sent", () => {
      res.headersSent = true;
      sessionSave.callsArg(0);

      monkeyPatchRedirectToSaveSessionMiddleware(
        req as Request,
        res as Response,
        next
      );

      res.redirect!("/test-url");

      expect(originalRedirect).to.not.have.been.called;
      expect(loggerWarnStub).to.have.been.calledOnce;
      expect(loggerWarnStub.firstCall.args[0]).to.deep.include({
        trace: "test-trace-id",
        path: "/test-path",
      });
      expect(loggerWarnStub.firstCall.args[1]).to.equal(
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

      res.redirect!("/test-url");

      expect(sessionSave).to.not.have.been.called;
      expect(originalRedirect).to.not.have.been.called;
      expect(loggerWarnStub).to.have.been.calledOnce;
      expect(loggerWarnStub.firstCall.args[0]).to.deep.include({
        trace: "test-trace-id",
        path: "/test-path",
      });
      expect(loggerWarnStub.firstCall.args[1]).to.equal(
        "Unable to redirect as headers are already sent"
      );
    });
  });
});
