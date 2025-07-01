import { NextFunction, Request, Response } from "express";
import { expect, sinon } from "../../utils/test-utils";
import { describe } from "mocha";
import { csrfErrorHandler } from "../../../src/handlers/csrf-error-handler";
import { PATH_DATA } from "../../../src/app.constants";

describe("csrf-error-handler", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = {
      log: {
        info: sandbox.fake(),
      },
    } as Partial<Request>;
    res = {
      redirect: sandbox.fake(() => {}),
      headersSent: false,
    };
    next = sandbox.fake(() => {});
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("csrfErrorHandler", () => {
    it("should call next when headers already sent", () => {
      res.headersSent = true;
      const error = { code: "EBADCSRFTOKEN" };

      csrfErrorHandler(error, req as Request, res as Response, next);

      expect(next).to.have.been.calledOnce;
      expect(res.redirect).to.not.have.been.called;
    });

    it("should redirect to your services page when CSRF token is invalid", () => {
      const error = { code: "EBADCSRFTOKEN", message: "invalid csrf token" };

      csrfErrorHandler(error, req as Request, res as Response, next);

      expect((req as any).log.info).to.have.been.calledOnceWith({
        msg: "Failed CSRF validation, redirecting to your services page.  Original error: invalid csrf token",
      });
      expect(res.redirect).to.have.been.calledOnceWith(
        PATH_DATA.YOUR_SERVICES.url
      );
      expect(next).to.not.have.been.called;
    });

    it("should call next with error when error code is not EBADCSRFTOKEN", () => {
      const error = { code: "OTHER_ERROR", message: "some other error" };

      csrfErrorHandler(error, req as Request, res as Response, next);

      expect(next).to.have.been.calledOnceWith(error);
      expect(res.redirect).to.not.have.been.called;
      expect((req as any).log.info).to.not.have.been.called;
    });
  });
});
