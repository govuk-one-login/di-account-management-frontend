import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import {
  checkYourPhoneGet,
  checkYourPhonePost,
} from "../check-your-phone-controller";
import { CheckYourPhoneServiceInterface } from "../types";
import { PATH_DATA } from "../../../app.constants";
import { TXMA_AUDIT_ENCODED } from "../../../../test/utils/builders";
import {
  INTENT_ADD_MFA_METHOD,
  INTENT_CHANGE_PHONE_NUMBER,
} from "../../check-your-email/types";
import { logger } from "../../../utils/logger";
import * as config from "../../../config";

describe("check your phone controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let fakeService: CheckYourPhoneServiceInterface;
  let errorLoggerSpy: sinon.SinonSpy;

  beforeEach(() => {
    delete process.env.SUPPORT_CHANGE_MFA;
    sandbox = sinon.createSandbox();
    errorLoggerSpy = sinon.spy(logger, "error");
    req = {
      body: {},
      t: sandbox.fake(),
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
      updatePhoneNumberWithMfaApi: sandbox.stub().resolves(true),
      addMfaMethodService: sandbox.stub().resolves(true),
    };
  });

  afterEach(() => {
    errorLoggerSpy.restore();
    sandbox.restore();
  });

  describe("checkYourPhoneGet", () => {
    it("should render check your phone view", () => {
      checkYourPhoneGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("check-your-phone/index.njk");
    });
  });

  describe("checkYourPhonePost", () => {
    it("should redirect to /phone-number-updated-confirmation when valid code entered", async () => {
      req.session.user.tokens = { accessToken: "token" } as any;
      req.body.code = "123456";
      req.session.user.state.changePhoneNumber.value = "CHANGE_VALUE";

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(fakeService.updatePhoneNumber).to.have.been.calledOnce;
      expect(res.redirect).to.have.calledWith(
        PATH_DATA.PHONE_NUMBER_UPDATED_CONFIRMATION.url
      );
    });

    it("should redirect to change default method confirmation when valid code entered", async () => {
      sandbox.replace(config, "supportChangeMfa", () => true);
      req.session.user.tokens = { accessToken: "token" } as any;
      req.body.intent = "changeDefaultMethod";
      req.session.user.state.changeDefaultMethod.value = "CHANGE_VALUE";

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(res.redirect).to.have.calledWith(
        PATH_DATA.CHANGE_DEFAULT_METHOD_CONFIRMATION.url
      );
    });

    it("should return error when invalid code entered", async () => {
      fakeService = {
        updatePhoneNumber: sandbox.fake.resolves(false),
        updatePhoneNumberWithMfaApi: sandbox.fake.resolves(false),
        addMfaMethodService: sandbox.fake.resolves(false),
      };

      req.session.user.tokens = { accessToken: "token" } as any;
      req.t = sandbox.fake.returns("translated string");
      req.body.code = "678988";
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
      const errorMessage = "No existing MFA method in handleChangePhoneNumber";
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

      expect(fakeService.updatePhoneNumberWithMfaApi).not.to.have.been.called;
      expect(fakeService.updatePhoneNumber).to.have.been.calledOnce;
      expect(fakeService.updatePhoneNumber).to.have.calledWith({
        email: "test@test.com",
        updatedValue: "07111111111",
        otp: "123456",
      });
      expect(res.redirect).to.have.calledWith(
        PATH_DATA.PHONE_NUMBER_UPDATED_CONFIRMATION.url
      );
      delete process.env.SUPPORT_CHANGE_MFA;
    });
  });

  describe("checkYourPhonePost with mfa method management API", () => {
    it("should redirect to /phone-number-updated-confirmation when valid code entered for change phone number journey", async () => {
      process.env.SUPPORT_CHANGE_MFA = "1";

      req.session.user.tokens = { accessToken: "token" } as any;
      req.session.user.state.changePhoneNumber.value = "CHANGE_VALUE";
      req.body.code = "123456";
      req.body.intent = INTENT_CHANGE_PHONE_NUMBER;
      req.session.user.newPhoneNumber = "07111111111";
      req.session.user.email = "test@test.com";

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(fakeService.updatePhoneNumberWithMfaApi).to.have.been.calledOnce;
      expect(fakeService.updatePhoneNumberWithMfaApi).to.have.calledWith({
        email: "test@test.com",
        otp: "123456",
        mfaMethod: {
          mfaIdentifier: "111111",
          methodVerified: true,
          method: {
            mfaMethodType: "SMS",
            phoneNumber: "07111111111",
          },
          priorityIdentifier: "DEFAULT",
        },
      });
      expect(res.redirect).to.have.calledWith(
        PATH_DATA.PHONE_NUMBER_UPDATED_CONFIRMATION.url
      );
      delete process.env.SUPPORT_CHANGE_MFA;
    });

    it("should redirect to /phone-number-updated-confirmation when valid code entered for add MFA method journey", async () => {
      process.env.SUPPORT_CHANGE_MFA = "1";

      req.session.user.tokens = { accessToken: "token" } as any;
      req.session.user.state.changePhoneNumber.value = "CHANGE_VALUE";
      req.body.code = "123456";
      req.body.intent = INTENT_ADD_MFA_METHOD;
      req.session.user.newPhoneNumber = "07111111111";
      req.session.user.email = "test@test.com";
      req.session.user.publicSubjectId = "111112";

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(fakeService.addMfaMethodService).to.have.been.calledOnce;
      expect(fakeService.addMfaMethodService).to.have.calledWith({
        email: "test@test.com",
        otp: "123456",
        credential: "no-credentials",
        mfaMethod: {
          mfaIdentifier: "111112",
          methodVerified: true,
          method: {
            mfaMethodType: "SMS",
            phoneNumber: "07111111111",
          },
          priorityIdentifier: "BACKUP",
        },
      });
      expect(res.redirect).to.have.calledWith(
        PATH_DATA.ADD_MFA_METHOD_SMS_CONFIRMATION.url
      );
      delete process.env.SUPPORT_CHANGE_MFA;
    });

    it("should log an error when priorityIdentifier is not valid", async () => {
      process.env.SUPPORT_CHANGE_MFA = "1";
      req.session.user.tokens = { accessToken: "token" } as any;
      req.session.user.state.changePhoneNumber.value = "CHANGE_VALUE";
      req.body.code = "123456";
      req.body.intent = INTENT_ADD_MFA_METHOD;
      req.session.user.newPhoneNumber = "07111111111";
      req.session.user.email = "test@test.com";
      req.session.mfaMethods[0].priorityIdentifier =
        "INVALID-PRIORITY-IDENTIFIER" as any;

      const errorMessage =
        "No existing DEFAULT MFA method in handleAddMfaMethod";
      (fakeService.updatePhoneNumber as sinon.SinonStub).throws(
        new Error(errorMessage)
      );

      try {
        await checkYourPhonePost(fakeService)(req as Request, res as Response);
        expect(fakeService.updatePhoneNumber).not.to.have.been.called;
        expect(fakeService.updatePhoneNumberWithMfaApi).not.to.have.been.called;
        expect(fakeService.addMfaMethodService).not.to.have.been.called;
      } catch (e) {
        expect(errorLoggerSpy).to.have.been.calledWith(errorMessage);
      }
      delete process.env.SUPPORT_CHANGE_MFA;
    });

    it("should log an error when intent is not valid", async () => {
      process.env.SUPPORT_CHANGE_MFA = "1";
      req.session.user.tokens = { accessToken: "token" } as any;
      req.session.user.state.changePhoneNumber.value = "CHANGE_VALUE";
      req.body.code = "123456";
      req.body.intent = "invalid-intent";
      req.session.user.newPhoneNumber = "07111111111";
      req.session.user.email = "test@test.com";

      const errorMessage = "Unknown phone verification intent invalid-intent";
      (fakeService.updatePhoneNumber as sinon.SinonStub).throws(
        new Error(errorMessage)
      );

      try {
        await checkYourPhonePost(fakeService)(req as Request, res as Response);
        expect(fakeService.updatePhoneNumber).not.to.have.been.called;
        expect(fakeService.updatePhoneNumberWithMfaApi).not.to.have.been.called;
        expect(fakeService.addMfaMethodService).not.to.have.been.called;
      } catch (e) {
        expect(errorLoggerSpy).to.have.been.calledWith(errorMessage);
      }
      delete process.env.SUPPORT_CHANGE_MFA;
    });

    it("should log an error when addMfaMethodService fails", async () => {
      process.env.SUPPORT_CHANGE_MFA = "1";
      req.session.user.tokens = { accessToken: "token" } as any;
      req.session.user.state.changePhoneNumber.value = "CHANGE_VALUE";
      req.body.code = "123456";
      req.body.intent = INTENT_ADD_MFA_METHOD;
      req.session.user.newPhoneNumber = "07111111111";
      req.session.user.email = "test@test.com";

      const errorMessage = "error message";
      (fakeService.addMfaMethodService as sinon.SinonStub).throws(
        new Error(errorMessage)
      );

      try {
        await checkYourPhonePost(fakeService)(req as Request, res as Response);
        expect(fakeService.updatePhoneNumber).not.to.have.been.called;
        expect(fakeService.updatePhoneNumberWithMfaApi).not.to.have.been.called;
      } catch (e) {
        expect(errorLoggerSpy).to.have.been.calledWith(errorMessage);
      }
      delete process.env.SUPPORT_CHANGE_MFA;
    });
  });
});
