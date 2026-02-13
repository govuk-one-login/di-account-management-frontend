import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import {
  changeDefaultMethodAppPost,
  changeDefaultMethodGet,
  changeDefaultMethodSmsGet,
  changeDefaultMethodSmsPost,
  changeDefaultMethodAppGet,
} from "../change-default-method-controllers";
import {
  RequestBuilder,
  ResponseBuilder,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";
import * as mfaModule from "../../../utils/mfa";
import * as commonMfaModule from "../../common/mfa";
import * as mfaClient from "../../../utils/mfaClient";
import { MfaMethod } from "../../../utils/mfaClient/types";
import { ERROR_CODES, PATH_DATA } from "../../../app.constants";
import { ChangePhoneNumberServiceInterface } from "../../change-phone-number/types";
import * as oidcModule from "../../../utils/oidc";
import { noUkPhoneNumberGet } from "../../no-uk-mobile-phone/no-uk-mobile-phone-controller";

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
      .withMfaMethods()
      .build();

    res = new ResponseBuilder()
      .withRender(sandbox.fake())
      .withRedirect(sandbox.fake(() => {}))
      .withStatus(sandbox.fake())
      .withLocals({})
      .build();

    sandbox.replace(oidcModule, "refreshToken", async () => {});
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
      await changeDefaultMethodGet(
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

      await changeDefaultMethodGet(
        req as unknown as Request,
        res as unknown as Response
      );

      expect(res.status).to.be.calledWith(404);
    });
  });

  describe("changeDefaultMethodAppPost", async () => {
    let mfaClientStub: sinon.SinonStubbedInstance<mfaClient.MfaClient>;
    let next: sinon.SinonSpy;

    beforeEach(() => {
      mfaClientStub = sandbox.createStubInstance(mfaClient.MfaClient);
      sandbox.replace(mfaClient, "createMfaClient", () =>
        Promise.resolve(mfaClientStub)
      );
      next = sandbox.spy();
    });

    it("should redirect to confirmation page when successful", async () => {
      sandbox.replace(mfaModule, "verifyMfaCode", async () => true);
      mfaClientStub.update.resolves({
        success: true,
        status: 200,
        data: [],
      });

      await changeDefaultMethodAppPost(
        req as unknown as Request,
        res as unknown as Response,
        next
      );

      expect(res.redirect).to.be.calledWith(
        PATH_DATA.CHANGE_DEFAULT_METHOD_CONFIRMATION.url
      );
      expect(mfaClientStub.update).to.be.calledOnce;
    });

    it("should return error if there is no code entered", async () => {
      //@ts-expect-error in test
      req.body.code = null;

      sandbox.replace(mfaModule, "verifyMfaCode", async () => true);

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

    it("should return an error if the code is less than 6 chars", async () => {
      //@ts-expect-error in test
      req.body.code = "1234";
      sandbox.replace(mfaModule, "verifyMfaCode", async () => true);

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

    it("should return an error if the code is entered wrong", async () => {
      sandbox.replace(mfaModule, "verifyMfaCode", async () => false);

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

    it("should throw an error when a user has no current default method", async () => {
      sandbox.replace(mfaModule, "verifyMfaCode", async () => true);
      req = new RequestBuilder()
        .withBody({ code: "123456", authAppSecret: "A".repeat(20) })
        .withSessionUserState({ changeDefaultMethod: { value: "APP" } })
        .withTranslate(sandbox.fake())
        .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
        .withNoDefaultMfaMethods()
        .build();

      expect(
        changeDefaultMethodAppPost(
          req as unknown as Request,
          res as unknown as Response,
          next
        )
      ).to.eventually.be.rejectedWith(
        "Could not change default method - no current default method found"
      );
    });

    it("should throw an error when the API call fails", async () => {
      sandbox.replace(mfaModule, "verifyMfaCode", async () => true);
      const response = {
        success: false,
        status: 400,
        data: [] as MfaMethod[],
        error: {
          code: 1,
          message: "Bad request",
        },
      };
      mfaClientStub.update.resolves(response);

      expect(
        changeDefaultMethodAppPost(
          req as unknown as Request,
          res as unknown as Response,
          next
        )
      ).to.eventually.be.rejectedWith(
        mfaClient.formatErrorMessage(
          "Could not change default method",
          response
        )
      );
    });
  });

  describe("changeDefaultMethodAppGet", () => {
    it("should render the app page correctly", async () => {
      sandbox.stub(commonMfaModule, "renderMfaMethodPage");
      const next = () => {};
      await changeDefaultMethodAppGet(
        req as unknown as Request,
        res as unknown as Response,
        next
      );
      expect(commonMfaModule.renderMfaMethodPage).to.be.calledWith(
        "change-default-method/change-to-app.njk",
        req,
        res,
        next,
        undefined,
        "/change-default-method"
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
        "change-default-method/change-to-sms.njk",
        { backLink: "/change-default-method" }
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

  describe("noUkPhoneNumberGet", () => {
    it("should redirect to the no uk phone number page", () => {
      // Arrange
      req = new RequestBuilder()
        .withHeaders({
          "txma-audit-encoded": TXMA_AUDIT_ENCODED,
          referer: PATH_DATA.CHANGE_DEFAULT_METHOD.url,
        })
        .withSessionUserState({ changeDefaultMethod: {} })
        .build();

      // Act
      noUkPhoneNumberGet(req as Request, res as Response);

      // Assert
      expect(res.redirect).to.be.calledWith(
        "/no-uk-mobile-phone?type=changeDefaultMethod"
      );
    });
  });
});
