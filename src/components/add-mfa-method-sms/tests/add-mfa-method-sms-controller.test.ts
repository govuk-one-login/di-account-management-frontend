import { expect } from "chai";
import { describe } from "mocha";
import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import {
  RequestBuilder,
  ResponseBuilder,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";
import { addMfaSmsMethodPost } from "../add-mfa-method-sms-controller";
import { PATH_DATA } from "../../../app.constants";

describe.only("add sms mfa method controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  const redirect = sinon.spy();

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = new RequestBuilder()
      .withBody({})
      .withSessionUserState({ addMfaMethod: { value: "CHANGE_VALUE" } })
      .withTimestampT(sandbox.fake())
      .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
      .build();

    res = new ResponseBuilder()
      .withRender(sandbox.fake())
      .withRedirect(redirect)
      .withStatus(sandbox.fake())
      .build();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should redirect the user to the check phone page", () => {
    req.body.ukPhoneNumber = "1234";
    console.log(req);
    addMfaSmsMethodPost(req as Request, res as Response);
    expect(redirect).to.be.calledWith(
      `${PATH_DATA.CHECK_YOUR_PHONE.url}?intent=addMfaMethod`
    );
  });
});
