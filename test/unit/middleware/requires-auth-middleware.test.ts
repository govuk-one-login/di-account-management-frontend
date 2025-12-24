import { expect } from "chai";
import { describe } from "mocha";
import { sinon } from "../../utils/test-utils";
import { requiresAuthMiddleware } from "../../../src/middleware/requires-auth-middleware";
import { PATH_DATA } from "../../../src/app.constants";
import { Request, Response, NextFunction } from "express";
import { generators } from "openid-client";
import { kmsService } from "../../../src/utils/kms";
import type { SignCommandOutput } from "@aws-sdk/client-kms";

describe("Requires auth middleware", () => {
  beforeEach(() => {
    process.env.ENABLE_JAR_AUTH = "0";
  });

  afterEach(() => {
    delete process.env.ENABLE_JAR_AUTH;
  });
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

  it("should redirect to Log in page with legacy parameters when ENABLE_JAR_AUTH is false", async () => {
    process.env.ENABLE_JAR_AUTH = "0";
    const sandbox: sinon.SinonSandbox = sinon.createSandbox();
    sandbox.stub(generators, "nonce").returns("generated");
    
    const req: Partial<Request> = {
      body: {},
      session: { 
        user: { isAuthenticated: undefined } as any,
      } as any,
      url: "/test_url",
      query: { cookie_consent: "test" },
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
    expect(req.oidc.authorizationUrl).to.have.been.calledOnceWith({
      client_id: 'test-client',
      response_type: 'code',
      scope: 'openid',
      state: 'generated',
      nonce: 'generated',
      redirect_uri: 'url',
      cookie_consent: "test",
      vtr: '["Cl.Cm"]',
      _ga: undefined
    })
    sandbox.restore();
  });

  it("should redirect to Log in page with new parameters when ENABLE_JAR_AUTH is true", async () => {
    process.env.ENABLE_JAR_AUTH = "1";
    const sandbox: sinon.SinonSandbox = sinon.createSandbox();
    sandbox.stub(generators, "nonce").returns("generated");
    sandbox.stub(kmsService, "sign").resolves({ Signature: [1, 2, 3] as unknown as Uint8Array, KeyId: "", SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_512", $metadata: {} }) as unknown as SignCommandOutput;
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    const req: Partial<Request> = {
      body: {},
      session: { 
        user: { isAuthenticated: undefined } as any,
      } as any,
      url: "/test_url",
      query: { cookie_consent: "test" },
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
    expect(kmsService.sign).to.have.called;
    expect(req.oidc.authorizationUrl).to.have.been.calledOnceWith({
      client_id: 'test-client',
      response_type: 'code',
      scope: 'openid',
      request: sinon.match(jwtRegex),
    })
    sandbox.restore();
  });
});
