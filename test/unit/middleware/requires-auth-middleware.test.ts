import { expect } from "chai";
import { describe } from "mocha";
import { sinon } from "../../utils/test-utils";
import { requiresAuthMiddleware } from "../../../src/middleware/requires-auth-middleware";
import { PATH_DATA } from "../../../src/app.constants";
import { Request, Response, NextFunction } from "express";

describe("Requires auth middleware", () => {
  it("should redirect to signed out page if user logged out", async () => {
    const req: any = {
      session: {
        user: {
          isAuthenticated: false,
        } as any,
      },
      cookies: {
        lo: "true",
      },
    };

    const res: any = { locals: {}, redirect: sinon.fake() };
    const nextFunction: NextFunction = sinon.fake(() => {});

    await requiresAuthMiddleware(req, res, nextFunction);

    expect(res.redirect).to.have.been.calledWith(PATH_DATA.USER_SIGNED_OUT.url);
    expect(nextFunction).to.have.not.been.called;
  });

  it("should redirect to session expired page if user not authenticated", async () => {
    const req: any = {
      session: {
        user: {
          email: "test@test.com",
          isAuthenticated: false,
        },
      },
    };

    const res: any = { locals: {}, redirect: sinon.fake() };
    const nextFunction: NextFunction = sinon.fake(() => {});

    await requiresAuthMiddleware(req, res, nextFunction);

    expect(res.redirect).to.have.been.calledWith(PATH_DATA.SESSION_EXPIRED.url);
    expect(nextFunction).to.have.not.been.called;
  });

  it("should redirect to session expired page if no user session", async () => {
    const req: any = {
      session: {
        user: {
          isAuthenticated: false,
        },
      },
    };
    const res: any = { locals: {}, redirect: sinon.fake() };
    const nextFunction: NextFunction = sinon.fake(() => {});

    await requiresAuthMiddleware(req, res, nextFunction);

    expect(res.redirect).to.have.been.calledWith(PATH_DATA.SESSION_EXPIRED.url);
    expect(nextFunction).to.have.not.been.called;
  });

  it("should call next user session is valid", async () => {
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
    const nextFunction: NextFunction = sinon.fake(() => {});

    await requiresAuthMiddleware(req, res, nextFunction);

    expect(nextFunction).to.have.been.calledOnce;
  });

  it("should call next and reset lo cookie to false if user is authenticated", async () => {
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
    const nextFunction: NextFunction = sinon.fake(() => {});

    await requiresAuthMiddleware(req, res, nextFunction);

    expect(nextFunction).to.have.been.calledOnce;
    expect(res.mockCookies.lo).to.equal("false");
  });

  it("should redirect to Log in page", async () => {
    const sandbox: sinon.SinonSandbox = sinon.createSandbox();
    const req: Partial<Request> = {
      body: {},
      query: {},
      session: { user: { isAuthenticated: undefined } as any } as any,
      url: "/test_url",
      oidc: {
        authorizationUrl: sandbox.spy(),
        metadata: {
          scopes: "openid",
          redirect_uris: ["url"],
          client_id: "test-client",
        },
      } as any, // Bypass type checking for this part,
    };

    const res: Partial<Response> = {
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      locals: {},
    };

    const nextFunction: NextFunction = sandbox.fake(() => {});
    await requiresAuthMiddleware(req as Request, res as Response, nextFunction);
    expect(res.redirect).to.have.called;
    expect(req.oidc.authorizationUrl).to.have.been.calledOnce;
    sandbox.restore();
  });
});
