import { expect } from "chai";
import sinon from "sinon";
import { Request, Response, NextFunction } from "express";
import { logErrorMiddleware } from "../../../src/middleware/log-error-middleware.js";
import * as shouldLogErrorModule from "../../../src/utils/shouldLogError.js";

describe("logErrorMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let shouldLogErrorStub: sinon.SinonStub;

  beforeEach(() => {
    req = {
      log: {
        error: sinon.spy(),
      },
    } as any;
    res = {};
    next = sinon.spy();
    shouldLogErrorStub = sinon.stub(shouldLogErrorModule, "shouldLogError");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should log error when shouldLogError returns true", () => {
    const error = new Error("Test error");
    shouldLogErrorStub.returns(true);

    logErrorMiddleware(error, req as Request, res as Response, next);

    expect(shouldLogErrorStub).to.have.been.calledOnceWith(error);
    expect(req.log.error).to.have.been.calledOnceWith(error, "Test error");
    expect(next).to.have.been.calledOnceWith(error);
  });

  it("should not log error when shouldLogError returns false", () => {
    const error = new Error("Test error");
    shouldLogErrorStub.returns(false);

    logErrorMiddleware(error, req as Request, res as Response, next);

    expect(shouldLogErrorStub).to.have.been.calledOnceWith(error);
    expect(req.log.error).to.not.have.been.called;
    expect(next).to.have.been.calledOnceWith(error);
  });

  it("should handle non-Error objects", () => {
    const error = "string error";
    shouldLogErrorStub.returns(true);

    logErrorMiddleware(error, req as Request, res as Response, next);

    expect(shouldLogErrorStub).to.have.been.calledOnceWith(error);
    expect(req.log.error).to.have.been.calledOnceWith(error, undefined);
    expect(next).to.have.been.calledOnceWith(error);
  });
});
