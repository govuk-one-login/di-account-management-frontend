import { NextFunction, Request, Response } from "express";
import { expect, sinon } from "../../utils/test-utils";
import { describe } from "mocha";
import { monkeyPatchRedirectToSaveSessionMiddleware } from "../../../src/middleware/monkey-patch-redirect-to-save-session-middleware";

describe("monkey-patch-redirect-to-save-session-middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let originalRedirect: sinon.SinonSpy;
  let sessionSave: sinon.SinonStub;

  beforeEach(() => {
    originalRedirect = sinon.spy();
    sessionSave = sinon.stub();

    req = {
      session: {
        save: sessionSave,
      } as any,
    };

    res = {
      redirect: originalRedirect,
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
  });
});
