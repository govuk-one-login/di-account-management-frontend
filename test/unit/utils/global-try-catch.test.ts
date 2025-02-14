import { expect } from "chai";
import { describe } from "mocha";
import sinon from "sinon";
import { NextFunction, Request, Response } from "express";
import {
  globalTryCatchAsync,
  globalTryCatch,
} from "../../../src/utils/global-try-catch";

describe("globalTryCatch", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = {};
    res = {};
    next = sandbox.fake() as unknown as NextFunction;
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("globalTryCatchAsync", () => {
    it("should call the provided function and not call next if no error", async () => {
      const fn = sandbox.fake.resolves(null);
      const wrappedFn = globalTryCatchAsync(fn);

      await wrappedFn(req as Request, res as Response, next);

      expect(fn).to.have.been.calledOnceWithExactly(req, res, next);
      expect(next).to.not.have.been.called;
    });

    it("should call next with the error if the provided function throws an error", async () => {
      const error = new Error("Test error");
      const fn = sandbox.fake.rejects(error);
      const wrappedFn = globalTryCatchAsync(fn);

      await wrappedFn(req as Request, res as Response, next);

      expect(fn).to.have.been.calledOnceWithExactly(req, res, next);
      expect(next).to.have.been.calledOnceWithExactly(error);
    });
  });

  describe("globalTryCatch", () => {
    it("should call the provided function and not call next if no error", () => {
      const fn = sandbox.fake();
      const wrappedFn = globalTryCatch(fn);

      wrappedFn(req as Request, res as Response, next);

      expect(fn).to.have.been.calledOnceWithExactly(req, res, next);
      expect(next).to.not.have.been.called;
    });

    it("should call next with the error if the provided function throws an error", () => {
      const error = new Error("Test error");
      const fn = sandbox.fake.throws(error);
      const wrappedFn = globalTryCatch(fn);

      wrappedFn(req as Request, res as Response, next);

      expect(fn).to.have.been.calledOnceWithExactly(req, res, next);
      expect(next).to.have.been.calledOnceWithExactly(error);
    });
  });
});
