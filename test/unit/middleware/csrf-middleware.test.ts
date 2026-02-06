import { expect } from "chai";
import { describe } from "mocha";
import { csrfMiddleware } from "../../../src/middleware/csrf-middleware.js";
import { NextFunction } from "express";
import { sinon } from "../../utils/test-utils.js";

describe("CSRF middleware", () => {
  it("should add csrf token to request locals", () => {
    const csrfToken = "a-csrf-token";
    const csrfTokenStub = sinon.fake.returns(csrfToken);
    const req: any = { csrfToken: csrfTokenStub };
    const res: any = { locals: {} };
    const nextFunction: NextFunction = sinon.fake(() => {});

    csrfMiddleware(req, res, nextFunction);

    expect(csrfTokenStub).to.have.been.called;
    expect(res.locals.csrfToken).to.equal(csrfToken);
    expect(nextFunction).to.have.been.called;
  });
});
