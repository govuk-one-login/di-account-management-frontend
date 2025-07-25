import { expect } from "chai";
import { describe } from "mocha";
import { NextFunction, Request, Response } from "express";
import { sinon } from "../../utils/test-utils";
import { mfaMethodMiddleware } from "../../../src/middleware/mfa-method-middleware";
import * as mfaClient from "../../../src/utils/mfaClient";
import { MfaMethod } from "../../../src/utils/mfaClient/types";
import Sinon from "sinon";

describe("mfaMethodMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mfaClientStub: sinon.SinonStubbedInstance<mfaClient.MfaClient>;
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
    next = sinon.fake(() => {});
    mfaClientStub = sinon.createStubInstance(mfaClient.MfaClient);
    sinon.stub(mfaClient, "createMfaClient").resolves(mfaClientStub);

    req = {
      session: {} as any,
      log: {
        error: sinon.fake(),
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

  it("should call next middleware with an error when request to retrieve MFA fails", async () => {
    mfaClientStub.retrieve.resolves({
      success: false,
      status: 403,
      error: { message: "Forbidden", code: 1 },
      data: [],
    });

    await mfaMethodMiddleware(req as Request, res as Response, next);
    expect(req.log.error).to.have.been.calledOnce;
    expect((next as Sinon.SinonSpy).getCalls()[0].args[0]).to.be.instanceOf(
      Error
    );
  });

  it("should call next middleware with an error when mfa retrieval throws an error", async () => {
    mfaClientStub.retrieve.rejects();

    await mfaMethodMiddleware(req as Request, res as Response, next);
    expect(req.log.error).to.have.been.calledOnce;
    expect((next as Sinon.SinonSpy).getCalls()[0].args[0]).to.be.instanceOf(
      Error
    );
  });
});
