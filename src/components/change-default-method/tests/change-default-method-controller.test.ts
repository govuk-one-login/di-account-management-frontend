import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import { changeDefaultMethodAppPost } from "../change-default-method-controllers";
import {
  RequestBuilder,
  ResponseBuilder,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";
import * as mfaModule from "../../../utils/mfa";
import { PATH_DATA } from "../../../app.constants";

describe("change default method controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = new RequestBuilder()
      .withBody({ code: "123456", authAppSecret: "A".repeat(20) })
      .withSessionUserState({ changeDefaultMethod: { value: "APP" } })
      .withTimestampT(sandbox.fake())
      .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
      .build();

    res = new ResponseBuilder()
      .withRender(sandbox.fake())
      .withRedirect(sandbox.fake(() => {}))
      .withStatus(sandbox.fake())
      .build();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("changeDefaultMethodMfaPost", async () => {
    it("should redirect to confirmation page", async () => {
      const next = sinon.spy();
      sandbox.replace(mfaModule, "updateMfaMethod", async () => true);
      sandbox.replace(mfaModule, "verifyMfaCode", () => true);

      await changeDefaultMethodAppPost(
        req as unknown as Request,
        res as unknown as Response,
        next
      );

      expect(res.redirect).to.be.calledWith(
        PATH_DATA.CHANGE_DEFAULT_METHOD_CONFIRMATION.url
      );
    });
  });
});
