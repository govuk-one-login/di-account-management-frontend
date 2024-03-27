import { expect } from "chai";
import { describe } from "mocha";
import { NextFunction, Request, Response } from "express";
import { sinon } from "../../utils/test-utils";
import * as mfa from "../../../src/utils/mfa";
import * as config from "../../../src/config";
import { mfaMethodMiddleware } from "../../../src/middleware/mfa-method-middleware";
import { ERROR_MESSAGES } from "../../../src/app.constants";

describe("mfaMethodMiddleware", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mfaStub: sinon.SinonStub;
  let shouldReturnFalse = false;
  let supportMfaPageStub: sinon.SinonStub;
  const info: sinon.SinonSpy = sinon.spy();

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    next = sinon.fake();
    mfaStub = sinon.stub(mfa, "default");
    supportMfaPageStub = sinon
      .stub(config, "supportMfaPage")
      .callsFake(() => !shouldReturnFalse);
    req = {
      body: {},
      query: {},
      session: {
        user: {
          email: "test@example.com",
          tokens: { accessToken: "dummytoken" },
        },
      } as any,
      oidc: { authorizationUrl: sinon.fake(), metadata: {} as any } as any,
      log: {
        info,
      } as any,
    };
    res = {
      render: sinon.fake(),
      redirect: sinon.fake(),
      locals: { trace: {} },
    };
  });

  afterEach(() => {
    supportMfaPageStub.restore();
    mfaStub.restore();
    sandbox.restore();
  });

  it("should not run if supportMfaPage is off", async () => {
    shouldReturnFalse = true;
    await mfaMethodMiddleware(req as Request, res as Response, next);
    expect(req.session.mfaMethods).not.to.exist;
  });

  it("should set mfaMethods in session on successful retrieval", async () => {
    res.locals.sessionId = "sessionId";
    res.locals.persistentSessionId = "persistentSessionId";
    shouldReturnFalse = false;

    mfaStub.resolves([
      {
        mfaIdentifier: 123456,
        priorityIdentifier: "PRIMARY",
        mfaMethodType: "AUTH_APP",
        endPoint: "http://mock-endpoint",
        methodVerified: true,
      },
    ]);

    await mfaMethodMiddleware(req as Request, res as Response, next);

    expect(req.session.mfaMethods).to.exist;
  });

  it("should continue to next middleware when mfa retrieval fails", async () => {
    res.locals.sessionId = "sessionId";
    res.locals.persistentSessionId = "persistentSessionId";
    shouldReturnFalse = false;

    mfaStub.rejects();

    await mfaMethodMiddleware(req as Request, res as Response, next);
    expect(info).to.have.been.calledWith(
      { trace: res.locals.trace },
      ERROR_MESSAGES.FAILED_MFA_RETRIEVE_CALL
    );
    expect(next).to.have.been.called;
  });
});
