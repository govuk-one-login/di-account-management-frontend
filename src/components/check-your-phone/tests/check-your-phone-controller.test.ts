import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import {
  checkYourPhoneGet,
  checkYourPhonePost,
} from "../check-your-phone-controller";
import { CheckYourPhoneServiceInterface } from "../types";
import { HTTP_STATUS_CODES, PATH_DATA } from "../../../app.constants";
import { TXMA_AUDIT_ENCODED } from "../../../../test/utils/builders";
import {
  INTENT_ADD_BACKUP,
  INTENT_CHANGE_DEFAULT_METHOD,
  INTENT_CHANGE_PHONE_NUMBER,
} from "../../check-your-email/types";
import { logger } from "../../../utils/logger";
import { MfaMethod } from "../../../utils/mfaClient/types";
import * as mfaClient from "../../../utils/mfaClient";
import * as oidcModule from "../../../utils/oidc";

describe("check your phone controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let fakeService: CheckYourPhoneServiceInterface;
  let errorLoggerSpy: sinon.SinonSpy;
  let stubMfaClient: sinon.SinonStubbedInstance<mfaClient.MfaClient>;

  const NEW_PHONE_NUMBER = "1234567890";

  const mfaMethod: MfaMethod = {
    mfaIdentifier: "1",
    priorityIdentifier: "BACKUP",
    methodVerified: true,
    method: { mfaMethodType: "SMS", phoneNumber: NEW_PHONE_NUMBER },
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    errorLoggerSpy = sinon.spy(logger, "error");
    req = {
      body: {},
      t: sandbox.fake((id) => id),
      session: {
        user: {
          state: {
            changePhoneNumber: { value: "CHANGE_VALUE" },
            changeDefaultMethod: { value: "CHANGE_VALUE" },
          },
        },
        mfaMethods: [
          {
            mfaIdentifier: "111111",
            methodVerified: true,
            method: {
              phoneNumber: "070",
              mfaMethodType: "SMS",
            },
            priorityIdentifier: "DEFAULT",
          },
        ],
      } as any,
      cookies: { lng: "en" },
      i18n: { language: "en" },
      headers: { "txma-audit-encoded": TXMA_AUDIT_ENCODED },
      query: { intent: INTENT_CHANGE_PHONE_NUMBER },
    };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      status: sandbox.fake(),
      locals: {
        trace: "trace-id",
      },
    };
    fakeService = {
      updatePhoneNumber: sandbox.stub().resolves(true),
    };

    stubMfaClient = sandbox.createStubInstance(mfaClient.MfaClient);
    sandbox.stub(mfaClient, "createMfaClient").resolves(stubMfaClient);
    sandbox.replace(oidcModule, "refreshToken", async () => {});
  });

  afterEach(() => {
    delete process.env.SUPPORT_CHANGE_MFA;
    errorLoggerSpy.restore();
    sandbox.restore();
  });

  describe("checkYourPhoneGet", () => {
    it("should render check your phone view", () => {
      checkYourPhoneGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith("check-your-phone/index.njk");
    });

    it("should render check your phone view with backLink intent change phone number", () => {
      if (req.query) {
        req.query.intent = INTENT_CHANGE_PHONE_NUMBER;
      }
      checkYourPhoneGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith("check-your-phone/index.njk", {
        phoneNumber: "",
        resendCodeLink: "/resend-phone-code?intent=changePhoneNumber",
        useDifferentPhoneNumberLink: "/change-phone-number",
        intent: "changePhoneNumber",
        backLink: "/change-phone-number",
      });
    });

    it("should render check your phone view with backLink intent add mfa method", () => {
      if (req.query) {
        req.query.intent = INTENT_ADD_BACKUP;
      }
      checkYourPhoneGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith("check-your-phone/index.njk", {
        phoneNumber: "",
        resendCodeLink: "/resend-phone-code?intent=addBackup",
        useDifferentPhoneNumberLink: "/add-mfa-method-sms",
        intent: "addBackup",
        backLink: "/add-mfa-method-sms",
      });
    });

    it("should render check your phone view with backLink intent change default method", () => {
      if (req.query) {
        req.query.intent = INTENT_CHANGE_DEFAULT_METHOD;
      }
      checkYourPhoneGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith("check-your-phone/index.njk", {
        phoneNumber: "",
        resendCodeLink: "/resend-phone-code?intent=changeDefaultMethod",
        useDifferentPhoneNumberLink: "/change-default-method-sms",
        intent: "changeDefaultMethod",
        backLink: "/change-default-method-sms",
      });
    });

    it("should throw an error when intent is not defined", () => {
      if (req.query) {
        req.query.intent = undefined;
      }

      expect(() => {
        checkYourPhoneGet(req as Request, res as Response);
      }).to.throw(
        "Intent does not map to a 'use a different phone number' link"
      );
      expect(res.render).not.to.have.been.called;
    });
  });

  describe("checkYourPhonePost", () => {
    it("should redirect to /phone-number-updated-confirmation when valid code entered", async () => {
      req.session.user.tokens = { accessToken: "token" } as any;
      req.body.code = "123456";
      req.body.intent = INTENT_CHANGE_PHONE_NUMBER;
      req.session.user.state.changePhoneNumber.value = "CHANGE_VALUE";

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(fakeService.updatePhoneNumber).to.have.been.calledOnce;
      expect(res.redirect).to.have.calledWith(
        PATH_DATA.PHONE_NUMBER_UPDATED_CONFIRMATION.url
      );
    });

    it("should return an error when user doesn't enter a code", async () => {
      fakeService = {
        updatePhoneNumber: sandbox.fake(),
      };

      req.body.code = "";
      req.body.intent = INTENT_CHANGE_PHONE_NUMBER;
      req.t = (id: string) => id;

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(fakeService.updatePhoneNumber).not.to.have.been.called;
      expect(res.render).to.have.been.calledWith("check-your-phone/index.njk", {
        errors: {
          code: {
            text: "pages.checkYourPhone.code.validationError.required",
            href: "#code",
          },
        },
        errorList: [
          {
            text: "pages.checkYourPhone.code.validationError.required",
            href: "#code",
          },
        ],
        code: "",
        intent: "changePhoneNumber",
        phoneNumber: "",
        resendCodeLink: "/resend-phone-code?intent=changePhoneNumber",
        useDifferentPhoneNumberLink: "/change-phone-number",
        backLink: "/change-phone-number",
        language: "en",
      });
      expect(res.status).to.have.been.calledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });

    it("should return an error when user enters a code which is too short", async () => {
      fakeService = {
        updatePhoneNumber: sandbox.fake(),
      };

      req.body.code = "123";
      req.body.intent = INTENT_CHANGE_PHONE_NUMBER;
      req.t = (id: string) => id;

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(fakeService.updatePhoneNumber).not.to.have.been.called;
      expect(res.render).to.have.been.calledWith("check-your-phone/index.njk", {
        errors: {
          code: {
            text: "pages.checkYourPhone.code.validationError.minLength",
            href: "#code",
          },
        },
        errorList: [
          {
            text: "pages.checkYourPhone.code.validationError.minLength",
            href: "#code",
          },
        ],
        code: "123",
        intent: "changePhoneNumber",
        phoneNumber: "",
        resendCodeLink: "/resend-phone-code?intent=changePhoneNumber",
        useDifferentPhoneNumberLink: "/change-phone-number",
        backLink: "/change-phone-number",
        language: "en",
      });
      expect(res.status).to.have.been.calledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });

    it("should return an error when user enters a code which is too long", async () => {
      fakeService = {
        updatePhoneNumber: sandbox.fake(),
      };

      req.body.code = "1234567";
      req.body.intent = INTENT_CHANGE_PHONE_NUMBER;
      req.t = (id: string) => id;

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(fakeService.updatePhoneNumber).not.to.have.been.called;
      expect(res.render).to.have.been.calledWith("check-your-phone/index.njk", {
        errors: {
          code: {
            text: "pages.checkYourPhone.code.validationError.maxLength",
            href: "#code",
          },
        },
        errorList: [
          {
            text: "pages.checkYourPhone.code.validationError.maxLength",
            href: "#code",
          },
        ],
        code: "1234567",
        intent: "changePhoneNumber",
        phoneNumber: "",
        resendCodeLink: "/resend-phone-code?intent=changePhoneNumber",
        useDifferentPhoneNumberLink: "/change-phone-number",
        backLink: "/change-phone-number",
        language: "en",
      });
      expect(res.status).to.have.been.calledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });

    it("should return an error when user enters a code which contains letters", async () => {
      fakeService = {
        updatePhoneNumber: sandbox.fake(),
      };

      req.body.code = "123abc";
      req.body.intent = INTENT_CHANGE_PHONE_NUMBER;
      req.t = (id: string) => id;

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(fakeService.updatePhoneNumber).not.to.have.been.called;
      expect(res.render).to.have.been.calledWith("check-your-phone/index.njk", {
        errors: {
          code: {
            text: "pages.checkYourPhone.code.validationError.invalidFormat",
            href: "#code",
          },
        },
        errorList: [
          {
            text: "pages.checkYourPhone.code.validationError.invalidFormat",
            href: "#code",
          },
        ],
        code: "123abc",
        intent: "changePhoneNumber",
        phoneNumber: "",
        resendCodeLink: "/resend-phone-code?intent=changePhoneNumber",
        useDifferentPhoneNumberLink: "/change-phone-number",
        backLink: "/change-phone-number",
        language: "en",
      });
      expect(res.status).to.have.been.calledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });

    it("should return error when invalid code entered", async () => {
      fakeService = {
        updatePhoneNumber: sandbox.fake.resolves(false),
      };

      req.session.user.tokens = { accessToken: "token" } as any;
      req.t = sandbox.fake.returns("translated string");
      req.body.code = "678988";
      req.body.intent = INTENT_CHANGE_PHONE_NUMBER;
      res.locals.sessionId = "123456-djjad";

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(fakeService.updatePhoneNumber).to.have.been.calledOnce;
      expect(res.render).to.have.been.calledWith("check-your-phone/index.njk");
    });

    it("should log an error when MFA method is invalid", async () => {
      process.env.SUPPORT_CHANGE_MFA = "1";

      req.session.user.tokens = { accessToken: "token" } as any;
      req.session.user.state.changePhoneNumber.value = "CHANGE_VALUE";
      req.body.code = "123456";
      req.body.intent = INTENT_CHANGE_PHONE_NUMBER;
      req.session.user.newPhoneNumber = "07111111111";
      req.session.user.email = "test@test.com";
      req.session.mfaMethods[0].method.mfaMethodType = "UNKNOWN" as any;
      const errorMessage =
        "Could not change phone number - no existing SMS methods found.";
      try {
        await checkYourPhonePost(fakeService)(req as Request, res as Response);
      } catch (e) {
        expect(errorLoggerSpy).to.have.been.calledWith(errorMessage);
      }
    });

    it("should redirect to /phone-number-updated-confirmation when valid code entered for legacy API", async () => {
      process.env.SUPPORT_CHANGE_MFA = "0";

      req.session.user.tokens = { accessToken: "token" } as any;
      req.session.user.state.changePhoneNumber.value = "CHANGE_VALUE";
      req.body.code = "123456";
      req.body.intent = INTENT_CHANGE_PHONE_NUMBER;
      req.session.user.newPhoneNumber = "07111111111";
      req.session.user.email = "test@test.com";

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(fakeService.updatePhoneNumber).to.have.been.calledOnce;
      expect(fakeService.updatePhoneNumber).to.have.calledWith({
        email: "test@test.com",
        updatedValue: "07111111111",
        otp: "123456",
      });
      expect(res.redirect).to.have.calledWith(
        PATH_DATA.PHONE_NUMBER_UPDATED_CONFIRMATION.url
      );
    });
  });

  describe("checkYourPhonePost with mfa method management API", () => {
    it("should render with the expected error message when an invalid OTP code is entered", async () => {
      process.env.SUPPORT_CHANGE_MFA = "1";

      req.session.user.state.changePhoneNumber.value = "CHANGE_VALUE";
      req.body.code = "123456";
      req.body.intent = INTENT_CHANGE_PHONE_NUMBER;
      req.session.user.newPhoneNumber = "07111111111";

      stubMfaClient.update.resolves({
        success: false,
        error: {
          code: 1020,
          message: "Invalid OTP code",
        },
        status: 200,
        data: [mfaMethod],
      });

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(stubMfaClient.update).to.have.calledWith(
        {
          mfaIdentifier: "111111",
          method: {
            mfaMethodType: "SMS",
            phoneNumber: "07111111111",
          },
          priorityIdentifier: "DEFAULT",
        },
        req.body.code
      );
      expect(res.render).to.have.been.calledWith("check-your-phone/index.njk", {
        errors: {
          code: {
            text: "pages.checkYourPhone.code.validationError.invalidCode",
            href: "#code",
          },
        },
        errorList: [
          {
            text: "pages.checkYourPhone.code.validationError.invalidCode",
            href: "#code",
          },
        ],
        code: "123456",
        intent: "changePhoneNumber",
        phoneNumber: "1111",
        resendCodeLink: "/resend-phone-code?intent=changePhoneNumber",
        useDifferentPhoneNumberLink: "/change-phone-number",
        backLink: "/change-phone-number",
        language: "en",
      });
      expect(res.redirect).not.to.have.been.called;
    });

    it("should redirect to /phone-number-updated-confirmation when valid code entered for change phone number journey", async () => {
      process.env.SUPPORT_CHANGE_MFA = "1";

      req.session.user.state.changePhoneNumber.value = "CHANGE_VALUE";
      req.body.code = "123456";
      req.body.intent = INTENT_CHANGE_PHONE_NUMBER;
      req.session.user.newPhoneNumber = "07111111111";

      stubMfaClient.update.resolves({
        success: true,
        status: 200,
        data: [mfaMethod],
      });

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(stubMfaClient.update).to.have.calledWith(
        {
          mfaIdentifier: "111111",
          method: {
            mfaMethodType: "SMS",
            phoneNumber: "07111111111",
          },
          priorityIdentifier: "DEFAULT",
        },
        req.body.code
      );
      expect(res.redirect).to.have.calledWith(
        PATH_DATA.PHONE_NUMBER_UPDATED_CONFIRMATION.url
      );
    });

    it("should redirect to /phone-number-updated-confirmation when valid code entered for add MFA method journey", async () => {
      process.env.SUPPORT_CHANGE_MFA = "1";
      req.body.code = "123456";
      req.body.intent = INTENT_ADD_BACKUP;
      req.session.user.newPhoneNumber = NEW_PHONE_NUMBER;

      stubMfaClient.create.resolves({
        success: true,
        status: 200,
        data: mfaMethod,
      });

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(res.redirect).to.have.calledWith(
        PATH_DATA.ADD_MFA_METHOD_SMS_CONFIRMATION.url
      );
    });

    it("should redirect to /phone-number-updated-confirmation when valid code entered for change default journey", async () => {
      process.env.SUPPORT_CHANGE_MFA = "1";
      req.body.code = "123456";
      req.body.intent = INTENT_CHANGE_DEFAULT_METHOD;
      req.session.user.newPhoneNumber = NEW_PHONE_NUMBER;

      stubMfaClient.update.resolves({
        success: true,
        status: 200,
        data: [mfaMethod],
      });

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(res.redirect).to.have.calledWith(
        PATH_DATA.CHANGE_DEFAULT_METHOD_CONFIRMATION.url
      );
    });

    it("should log an error when intent is not valid", async () => {
      process.env.SUPPORT_CHANGE_MFA = "1";
      req.session.user.tokens = { accessToken: "token" } as any;
      req.session.user.state.changePhoneNumber.value = "CHANGE_VALUE";
      req.body.code = "123456";
      req.body.intent = "invalid-intent";
      req.session.user.newPhoneNumber = "07111111111";
      req.session.user.email = "test@test.com";

      const errorMessage = `Could not change phone number - unknown intent: ${req.body.intent}`;

      try {
        await checkYourPhonePost(fakeService)(req as Request, res as Response);
      } catch {
        expect(errorLoggerSpy).to.have.been.calledWith(
          { trace: res.locals.trace },
          errorMessage
        );
        expect(fakeService.updatePhoneNumber).not.to.have.been.called;
        expect(stubMfaClient.update).not.to.have.been.called;
        expect(stubMfaClient.create).not.to.have.been.called;
      }
    });

    it("should log an error when adding a backup MFA method fails", async () => {
      process.env.SUPPORT_CHANGE_MFA = "1";
      req.body.code = "123456";
      req.body.intent = INTENT_ADD_BACKUP;
      req.session.user.newPhoneNumber = NEW_PHONE_NUMBER;

      const response = {
        success: false,
        status: 403,
        error: { code: 1, message: "Not authorized" },
        data: {} as MfaMethod,
      };
      stubMfaClient.create.resolves(response);

      try {
        await checkYourPhonePost(fakeService)(req as Request, res as Response);
      } catch {
        expect(fakeService.updatePhoneNumber).not.to.have.been.called;
        expect(stubMfaClient.update).not.to.have.been.called;
        expect(errorLoggerSpy).to.have.been.calledWith(
          { trace: res.locals.trace },
          mfaClient.formatErrorMessage(
            "Could not change phone number",
            response
          )
        );
      }
    });
  });
});
