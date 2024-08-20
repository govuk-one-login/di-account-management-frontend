import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import {
  changeDefaultMethodAppPost,
  changeDefaultMethodGet,
} from "../change-default-method-controllers";
import {
  RequestBuilder,
  ResponseBuilder,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";
import * as mfaModule from "../../../utils/mfa";
import { PATH_DATA } from "../../../app.constants";

describe("change default method controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: object;
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

  describe("changeDefaultMethodGet", async () => {
    it("should correctly render the page", async () => {
      //@ts-expect-error in test
      req.session = {
        mfaMethods: [
          {
            priorityIdentifier: "DEFAULT",
            method: {
              mfaMethodType: "SMS",
              phoneNumber: "12345678",
            },
          },
        ],
      };
      changeDefaultMethodGet(
        req as unknown as Request,
        res as unknown as Response
      );
      expect(res.render).to.be.calledWith("change-default-method/index.njk", {
        currentMethodType: "SMS",
        phoneNumber: "5678",
      });
    });

    it("should return 404 if there is no default method", async () => {
      //@ts-expect-error in test
      req.session = { mfaMethods: [] };

      changeDefaultMethodGet(
        req as unknown as Request,
        res as unknown as Response
      );

      expect(res.status).to.be.calledWith(404);
    });
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

    it("should return error if there is no code entered", async () => {
      //@ts-expect-error in test
      req.body.code = null;
      const next = sinon.spy();
      sandbox.replace(mfaModule, "updateMfaMethod", async () => true);
      sandbox.replace(mfaModule, "verifyMfaCode", () => true);

      await changeDefaultMethodAppPost(
        req as unknown as Request,
        res as unknown as Response,
        next
      );

      expect(res.render).to.be.calledWithMatch(
        "change-default-method/change-to-app.njk",
        sinon.match.hasNested("errors.code.href", "#code")
      );
    });

    it("should return an erorr if the code is less than 6 chars", async () => {
      //@ts-expect-error in test
      req.body.code = "1234";
      const next = sinon.spy();
      sandbox.replace(mfaModule, "updateMfaMethod", async () => true);
      sandbox.replace(mfaModule, "verifyMfaCode", () => true);

      await changeDefaultMethodAppPost(
        req as unknown as Request,
        res as unknown as Response,
        next
      );

      expect(res.render).to.be.calledWithMatch(
        "change-default-method/change-to-app.njk",
        sinon.match.hasNested("errors.code.href", "#code")
      );
    });

    it("should return an erorr if the code is entered wrong", async () => {
      const next = sinon.spy();
      sandbox.replace(mfaModule, "updateMfaMethod", async () => true);
      sandbox.replace(mfaModule, "verifyMfaCode", () => false);

      await changeDefaultMethodAppPost(
        req as unknown as Request,
        res as unknown as Response,
        next
      );

      expect(res.render).to.be.calledWithMatch(
        "change-default-method/change-to-app.njk",
        sinon.match.hasNested("errors.code.href", "#code")
      );
    });
  });
});
