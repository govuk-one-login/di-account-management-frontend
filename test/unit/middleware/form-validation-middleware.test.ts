import { expect } from "chai";
import { describe } from "mocha";
import { NextFunction, Request, Response } from "express";
import { sinon } from "../../utils/test-utils.js";
import {
  validateBodyMiddleware,
  validationErrorFormatter,
} from "../../../src/middleware/form-validation-middleware.js";

describe("HTML Lang middleware", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = {
      i18n: { language: "en" } as any,
    };
    res = { locals: {} };
    next = sandbox.fake(() => {});
  });

  afterEach(() => {
    sandbox.restore();
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

      expect(formattedError).to.be.eql({
        text: error.msg,
        href: `#${error.path}`,
      });
    });
  });

  describe("validateBodyMiddleware", () => {
    it("should validate request", () => {
      validateBodyMiddleware("test.html")(
        req as Request,
        res as Response,
        next
      );
      expect(next).to.have.been.called;
    });

    it("should call next function", () => {
      validateBodyMiddleware("test.html")(
        req as Request,
        res as Response,
        next
      );
      expect(next).to.have.been.called;
    });
  });
});
