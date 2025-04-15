import { expect } from "chai";
import { describe } from "mocha";
import { NextFunction, Request, Response } from "express";
import { sinon } from "../../utils/test-utils";
import { mfaMethodMiddleware } from "../../../src/middleware/mfa-method-middleware";
import { ERROR_MESSAGES } from "../../../src/app.constants";
import * as mfaClient from "../../../src/utils/mfaClient";
import { MfaMethod } from "../../../src/utils/mfaClient/types";

describe("mfaMethodMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mfaClientStub: sinon.SinonStubbedInstance<mfaClient.MfaClient>;
  const error: sinon.SinonSpy = sinon.spy();

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

  it("should continue to next middleware when request to retrieve MFA fails", async () => {
    mfaClientStub.retrieve.resolves({
      success: false,
      status: 403,
      problem: { title: "Forbidden" },
      data: [],
    });

    await mfaMethodMiddleware(req as Request, res as Response, next);
    expect(error).to.have.been.calledWith(
      { trace: res.locals.trace },
      "Failed MFA retrieve with error: Forbidden"
    );
    expect(next).to.have.been.called;
  });

  it("should continue to next middleware when mfa retrieval throws an error", async () => {
    mfaClientStub.retrieve.rejects();

    await mfaMethodMiddleware(req as Request, res as Response, next);
    expect(error).to.have.been.calledWith(
      { trace: res.locals.trace },
      ERROR_MESSAGES.FAILED_MFA_RETRIEVE_CALL
    );
    expect(next).to.have.been.called;
  });
});
