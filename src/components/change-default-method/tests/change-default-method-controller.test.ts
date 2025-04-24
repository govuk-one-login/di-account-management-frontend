import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import {
  changeDefaultMethodAppPost,
  changeDefaultMethodGet,
  changeDefaultMethodSmsGet,
  changeDefaultMethodSmsPost,
} from "../change-default-method-controllers";
import {
  RequestBuilder,
  ResponseBuilder,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";
import * as mfaModule from "../../../utils/mfa";
import { ERROR_CODES, PATH_DATA } from "../../../app.constants";
import { ChangePhoneNumberServiceInterface } from "../../change-phone-number/types";

describe("change default method controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: object;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = new RequestBuilder()
      .withBody({ code: "123456", authAppSecret: "A".repeat(20) })
      .withSessionUserState({ changeDefaultMethod: { value: "APP" } })
      .withTranslate(sandbox.fake())
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

  describe("changeDefaultMethodSmsGet", () => {
    it("should render the sms page correctly", async () => {
      await changeDefaultMethodSmsGet(
        req as unknown as Request,
        res as unknown as Response
      );
      expect(res.render).to.be.calledWith(
        "change-default-method/change-to-sms.njk"
      );
    });
  });

  describe("changeDefaultMethodSmsPost", () => {
    it("should send phone verification number correctly", async () => {
      const serviceMock: ChangePhoneNumberServiceInterface = {
        sendPhoneVerificationNotification: sinon.stub().returns({
          success: true,
        }),
      };

      const handler = changeDefaultMethodSmsPost(serviceMock);

      await handler(req as unknown as Request, res as unknown as Response);

      expect(res.redirect).to.be.calledWith(
        "/check-your-phone?intent=changeDefaultMethod"
      );
    });

    it("should show an error if the user tries to use the same number", async () => {
      const serviceMock: ChangePhoneNumberServiceInterface = {
        sendPhoneVerificationNotification: sinon.stub().returns({
          success: false,
          code: ERROR_CODES.NEW_PHONE_NUMBER_SAME_AS_EXISTING,
        }),
      };

      const handler = changeDefaultMethodSmsPost(serviceMock);

      await handler(req as unknown as Request, res as unknown as Response);

      expect(res.render).to.be.calledWithMatch(
        "change-default-method/change-to-sms.njk",
        sinon.match.hasNested("errors.phoneNumber.href", "#phoneNumber")
      );
    });
  });
});
