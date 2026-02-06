import { NextFunction, Request, Response } from "express";
import { expect, sinon } from "../../utils/test-utils";
import { describe } from "mocha";
import { noCacheMiddleware } from "../../../src/middleware/no-cache-middleware.js";

describe("no-cache-middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {} as Partial<Request>;
    res = {
      set: sinon.fake(),
    };
    next = sinon.fake(() => {});
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("noCacheMiddleware", () => {
    it("should set Cache-Control header with no-cache directives", () => {
      noCacheMiddleware(req as Request, res as Response, next);

      expect(res.set).to.have.been.calledOnceWith(
        "Cache-Control",
        "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
      );
      expect(next).to.have.been.calledOnce;
    });
  });
});
