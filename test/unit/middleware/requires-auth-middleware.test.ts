import { expect } from "chai";
import { describe } from "mocha";
import { NextFunction } from "express";
import { sinon } from "../../utils/test-utils";
import { requiresAuthMiddleware } from "../../../src/middleware/requires-auth-middleware";
import { PATH_DATA } from "../../../src/app.constants";

const MOCK_END_SESSION_URL = "mock end session url";

describe("Requires auth middleware", () => {
  it("should redirect to signed out page if user logged out", () => {
    const req: any = {
      session: {},
      oidc: {
        endSessionUrl: function () {
          return MOCK_END_SESSION_URL;
        },
      },
      cookies: {
        lo: "true",
      },
    };

    const res: any = { locals: {}, redirect: sinon.fake() };
    const nextFunction: NextFunction = sinon.fake();

    requiresAuthMiddleware(req, res, nextFunction);

    expect(res.redirect).to.have.been.calledWith(MOCK_END_SESSION_URL);
    expect(nextFunction).to.have.not.been.called;
  });

  it("should redirect to session expired page if user not authenticated", () => {
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

    expect(res.redirect).to.have.been.calledWith(PATH_DATA.SESSION_EXPIRED.url);
    expect(nextFunction).to.have.not.been.called;
  });

  it("should redirect to session expired page if no user session", () => {
    const req: any = { session: {} };
    const res: any = { locals: {}, redirect: sinon.fake() };
    const nextFunction: NextFunction = sinon.fake();

    requiresAuthMiddleware(req, res, nextFunction);

    expect(res.redirect).to.have.been.calledWith(PATH_DATA.SESSION_EXPIRED.url);
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
    const res: any = {
      locals: {},
      redirect: sinon.fake(),
      cookie: sinon.fake(),
    };
    const nextFunction: NextFunction = sinon.fake();

    requiresAuthMiddleware(req, res, nextFunction);

    expect(nextFunction).to.have.been.calledOnce;
  });

  it("should call next and reset lo cookie to false if user is authenticated", () => {
    const req: any = {
      session: {
        user: {
          email: "test@test.com",
          isAuthenticated: true,
        },
        cookies: {
          lo: "true",
        },
      },
    };

    const res: any = {
      locals: {},
      redirect: sinon.fake(),
      mockCookies: {},
      cookie: function (name: string, value: string) {
        this.mockCookies[name] = value;
      },
    };
    const nextFunction: NextFunction = sinon.fake();

    requiresAuthMiddleware(req, res, nextFunction);

    expect(nextFunction).to.have.been.calledOnce;
    expect(res.mockCookies.lo).to.equal("false");
  });
});
