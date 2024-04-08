import { expect } from "chai";
import { describe, it } from "mocha";
import { Request, Response } from "express";
import sinon, { SinonSandbox } from "sinon";
import { addMfaMethodPost } from "../add-mfa-methods-controller";
import { PATH_DATA } from "../../../app.constants";

describe("addMfaMethodPost", () => {
  let sandbox: SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: sinon.SinonSpy;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = { body: {}, log: { error: sandbox.fake() } as any };
    res = {
      status: sandbox.fake(),
      end: sandbox.fake(),
      redirect: sandbox.fake(),
    };
    next = sinon.spy();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should take the use to the add backup phone number page when that option is selected", () => {
    req.body.addMfaMethod = "sms";

    addMfaMethodPost(req as Request, res as Response, next);

    expect(res.redirect).to.have.been.calledWith(
      PATH_DATA.ADD_MFA_METHOD_SMS.url
    );
  });

  it("should take the user to the add auth app page when the user selects that option", () => {
    req.body.addMfaMethod = "app";

    addMfaMethodPost(req as Request, res as Response, next);

    expect(res.redirect).to.have.been.calledWith(
      PATH_DATA.ADD_MFA_METHOD_APP.url
    );
  });

  it("should call next with an error when addMfaMethod is unknown", () => {
    req.body.addMfaMethod = "unknown";

    addMfaMethodPost(req as Request, res as Response, next);

    const call: sinon.SinonSpyCall<Error[], unknown> = next.getCall(0);

    expect(call.args[0].message).to.equal("Unknown addMfaMethod: unknown");
  });
});
