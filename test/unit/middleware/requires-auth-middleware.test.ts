import { expect } from "chai";
import { describe } from "mocha";
import { NextFunction } from "express";
import { sinon } from "../../utils/test-utils";
import { requiresAuthMiddleware } from "../../../src/middleware/requires-auth-middleware";

describe("Requires auth middleware", () => {
  it("should redirect to start if user not authenticated", () => {
    const req: any = {
      session: {
        user: {
          email: "test@test.com",
          isAuthenticated: false,
        },
      },
    };

    const res: any = { locals: {}, redirect: sinon.fake() };
    const nextFunction: NextFunction = sinon.fake();

    requiresAuthMiddleware(req, res, nextFunction);

    expect(res.redirect).to.have.been.calledOnce;
    expect(nextFunction).to.have.not.been.called;
  });

  it("should redirect to start if no user session", () => {
    const req: any = { session: {} };
    const res: any = { locals: {}, redirect: sinon.fake() };
    const nextFunction: NextFunction = sinon.fake();

    requiresAuthMiddleware(req, res, nextFunction);

    expect(res.redirect).to.have.been.calledOnce;
    expect(nextFunction).to.have.not.been.called;
  });

  it("should call next user session is valid", () => {
    const req: any = {
      session: {
        user: {
          email: "test@test.com",
          isAuthenticated: true,
        },
      },
    };
    const res: any = { locals: {}, redirect: sinon.fake() };
    const nextFunction: NextFunction = sinon.fake();

    requiresAuthMiddleware(req, res, nextFunction);

    expect(nextFunction).to.have.been.calledOnce;
  });
});
