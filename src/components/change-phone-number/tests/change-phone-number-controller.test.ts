import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import { ChangePhoneNumberServiceInterface } from "../types";
import { ERROR_CODES, PATH_DATA } from "../../../app.constants";
import {
  changePhoneNumberGet,
  changePhoneNumberPost,
} from "../change-phone-number-controller";
import {
  CLIENT_SESSION_ID,
  CURRENT_EMAIL,
  ENGLISH,
  PERSISTENT_SESSION_ID,
  RequestBuilder,
  ResponseBuilder,
  SESSION_ID,
  SOURCE_IP,
  TOKEN,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";

describe("change phone number controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = new RequestBuilder()
      .withBody({})
      .withSessionUserState({ changePhoneNumber: {} })
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

  describe("changePhoneNumberGet", () => {
    it("should render change phone number page", () => {
      // Act
      changePhoneNumberGet(req as Request, res as Response);

      // Assert
      expect(res.render).to.have.calledWith("change-phone-number/index.njk");
    });
  });

  describe("changePhoneNumberPost", () => {
    it("should redirect to /phone-number-updated-confirmation page", async () => {
      // Arrange
      const fakeService: ChangePhoneNumberServiceInterface = {
        sendPhoneVerificationNotification: sandbox.fake.resolves({
          success: true,
        }),
      };
      req.body.phoneNumber = "12345678991";
      req.session.user.state.changePhoneNumber.value = "CHANGE_VALUE";

      // Act
      await changePhoneNumberPost(fakeService)(req as Request, res as Response);

      // Assert
      expect(fakeService.sendPhoneVerificationNotification).to.have.been
        .calledOnce;
      expect(
        fakeService.sendPhoneVerificationNotification
      ).to.have.been.calledWithExactly(
        TOKEN,
        CURRENT_EMAIL,
        "12345678991",
        SOURCE_IP,
        SESSION_ID,
        PERSISTENT_SESSION_ID,
        ENGLISH,
        CLIENT_SESSION_ID,
        TXMA_AUDIT_ENCODED
      );
      expect(res.redirect).to.have.calledWith(
        `${PATH_DATA.CHECK_YOUR_PHONE.url}?intent=changePhoneNumber`
      );
    });

    it("should return validation error when same UK number", async () => {
      // Arrange
      const fakeService: ChangePhoneNumberServiceInterface = {
        sendPhoneVerificationNotification: sandbox.fake.resolves({
          success: false,
          code: ERROR_CODES.NEW_PHONE_NUMBER_SAME_AS_EXISTING,
        }),
      };
      req.session.user.tokens = { accessToken: "token" } as any;
      req.body.phoneNumber = "12345678991";

      // Act
      await changePhoneNumberPost(fakeService)(req as Request, res as Response);

      // Assert
      expect(fakeService.sendPhoneVerificationNotification).to.have.been.called;
      expect(
        fakeService.sendPhoneVerificationNotification
      ).to.have.been.calledWithExactly(
        TOKEN,
        CURRENT_EMAIL,
        "12345678991",
        SOURCE_IP,
        SESSION_ID,
        PERSISTENT_SESSION_ID,
        ENGLISH,
        CLIENT_SESSION_ID,
        TXMA_AUDIT_ENCODED
      );
      expect(res.render).to.have.calledWith("change-phone-number/index.njk");
    });

    it("should return validation error when same international number", async () => {
      // Arrange
      const fakeService: ChangePhoneNumberServiceInterface = {
        sendPhoneVerificationNotification: sandbox.fake.resolves({
          success: false,
          code: ERROR_CODES.NEW_PHONE_NUMBER_SAME_AS_EXISTING,
        }),
      };
      req.body.phoneNumber = "12345678991";
      req.body.hasInternationalPhoneNumber = true;

      // Act
      await changePhoneNumberPost(fakeService)(req as Request, res as Response);

      // Assert
      expect(fakeService.sendPhoneVerificationNotification).to.have.been.called;
      expect(
        fakeService.sendPhoneVerificationNotification
      ).to.have.been.calledWithExactly(
        TOKEN,
        CURRENT_EMAIL,
        "12345678991",
        SOURCE_IP,
        SESSION_ID,
        PERSISTENT_SESSION_ID,
        ENGLISH,
        CLIENT_SESSION_ID,
        TXMA_AUDIT_ENCODED
      );
      expect(res.render).to.have.calledWith("change-phone-number/index.njk");
    });

    it("should redirect to /phone-number-updated-confirmation when success with valid international number", async () => {
      // Arrange
      const fakeService: ChangePhoneNumberServiceInterface = {
        sendPhoneVerificationNotification: sandbox.fake.resolves({
          success: true,
        }),
      };
      req.body.phoneNumber = "+33645453322";
      req.session.user.state.changePhoneNumber.value = "CHANGE_VALUE";
      // Act
      await changePhoneNumberPost(fakeService)(req as Request, res as Response);

      // Assert
      expect(fakeService.sendPhoneVerificationNotification).to.have.been
        .calledOnce;
      expect(
        fakeService.sendPhoneVerificationNotification
      ).to.have.been.calledWithExactly(
        TOKEN,
        CURRENT_EMAIL,
        "+33645453322",
        SOURCE_IP,
        SESSION_ID,
        PERSISTENT_SESSION_ID,
        ENGLISH,
        CLIENT_SESSION_ID,
        TXMA_AUDIT_ENCODED
      );
      expect(res.redirect).to.have.calledWith(
        `${PATH_DATA.CHECK_YOUR_PHONE.url}?intent=changePhoneNumber`
      );
    });
  });
});
