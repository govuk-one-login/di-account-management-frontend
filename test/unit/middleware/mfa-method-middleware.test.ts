import { expect } from "chai";
import { describe } from "mocha";
import { NextFunction, Request, Response } from "express";
import { sinon } from "../../utils/test-utils";
import { mfaMethodMiddleware } from "../../../src/middleware/mfa-method-middleware";
import * as mfaClient from "../../../src/utils/mfaClient";
import { MfaMethod } from "../../../src/utils/mfaClient/types";

describe("mfaMethodMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mfaClientStub: sinon.SinonStubbedInstance<mfaClient.MfaClient>;
  const error: sinon.SinonSpy = sinon.spy();
  const configFuncs = require("../../../src/config");
  const legacyMfaMiddleware = require("../../../src/middleware/mfa-methods-legacy");
  const sandbox = sinon.createSandbox();

  const mfaMethod: MfaMethod = {
    mfaIdentifier: "1",
    priorityIdentifier: "DEFAULT",
    methodVerified: true,
    method: {
      mfaMethodType: "AUTH_APP",
      credential: "1234567890",
    },
  };

  beforeEach(() => {
    sandbox.stub(configFuncs, "supportMfaManagement").returns(true);
    sandbox
      .stub(configFuncs, "getMfaServiceUrl")
      .returns("https://method-management-v1-stub.home.build.account.gov.uk");
    next = sinon.fake(() => {});
    mfaClientStub = sinon.createStubInstance(mfaClient.MfaClient);
    sinon.stub(mfaClient, "createMfaClient").returns(mfaClientStub);

    req = {
      session: {} as any,
      log: {
        error,
      } as any,
    };
    res = {
      render: sinon.fake(),
      redirect: sinon.fake(() => {}),
      locals: { trace: "trace" },
    };
  });

  afterEach(() => {
    sinon.restore();
    sandbox.restore();
  });

  it("should set mfaMethods in session on successful retrieval", async () => {
    mfaClientStub.retrieve.resolves({
      success: true,
      status: 200,
      data: [mfaMethod],
    });

    await mfaMethodMiddleware(req as Request, res as Response, next);

    expect(req.session.mfaMethods).to.deep.eq([mfaMethod]);
  });

  it("should not continue to next middleware when request to retrieve MFA fails", async () => {
    mfaClientStub.retrieve.resolves({
      success: false,
      status: 403,
      error: { message: "Forbidden", code: 1 },
      data: [],
    });

    await mfaMethodMiddleware(req as Request, res as Response, next);
    expect(error).to.have.been.calledWith(
      { trace: res.locals.trace },
      "Failed MFA retrieve. Status code: 403, API error code: 1, API error message: Forbidden"
    );
    expect(next).to.have.been.called;
  });

  it("should continue to next middleware when mfa retrieval throws an error", async () => {
    mfaClientStub.retrieve.rejects();

    await mfaMethodMiddleware(req as Request, res as Response, next);
    expect(error).to.have.been.calledWith(
      { trace: res.locals.trace },
      "Failed MFA retrieve. Status code: 403, API error code: 1, API error message: Forbidden"
    );
    expect(next).to.have.been.called;
  });

  it("should use legacy mfa middleware if MFA service URL is invalid", async () => {
    configFuncs.getMfaServiceUrl.restore();
    sandbox.stub(configFuncs, "getMfaServiceUrl").returns("not-a-valid-url");
    sandbox.stub(legacyMfaMiddleware, "runLegacyMfaMethodsMiddleware");
    await mfaMethodMiddleware(req as Request, res as Response, next);
    expect(
      legacyMfaMiddleware.runLegacyMfaMethodsMiddleware
    ).to.have.been.calledWith(req, res, next);
  });

  it("should use legacy mfa middleware if supportMfaManagement returns false", async () => {
    configFuncs.supportMfaManagement.restore();
    sandbox.stub(configFuncs, "supportMfaManagement").returns(false);
    sandbox.stub(legacyMfaMiddleware, "runLegacyMfaMethodsMiddleware");
    await mfaMethodMiddleware(req as Request, res as Response, next);
    expect(
      legacyMfaMiddleware.runLegacyMfaMethodsMiddleware
    ).to.have.been.calledWith(req, res, next);
  });
});
