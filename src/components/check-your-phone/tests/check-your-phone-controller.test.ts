import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { checkYourPhonePost } from "../check-your-phone-controller.js";
import { PATH_DATA } from "../../../app.constants";
import { TXMA_AUDIT_ENCODED } from "../../../../test/utils/builders";
import {
  INTENT_ADD_BACKUP,
  INTENT_CHANGE_DEFAULT_METHOD,
  INTENT_CHANGE_PHONE_NUMBER,
} from "../../check-your-email/types";
import { logger } from "../../../utils/logger.js";
import { MfaMethod } from "../../../utils/mfaClient/types";
import * as mfaClient from "../../../utils/mfaClient/index.js";
import * as oidcModule from "../../../utils/oidc.js";

const NEW_PHONE_NUMBER = "07123456789";
const mfaMethod: MfaMethod = {
  mfaIdentifier: "111111",
  methodVerified: true,
  method: {
    phoneNumber: "07123456789",
    mfaMethodType: "SMS",
  },
  priorityIdentifier: "DEFAULT",
};

describe("check your phone controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let errorLoggerSpy: ReturnType<typeof vi.fn>;
  let stubMfaClient: any;

  beforeEach(() => {
    errorLoggerSpy = vi.spyOn(logger, "error");
    req = {
      body: {},
      t: vi.fn((id) => id),
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
          {
            mfaIdentifier: "2",
            priorityIdentifier: "BACKUP",
            method: { mfaMethodType: "AUTH_APP", credential: "abc123" },
            methodVerified: true,
          },
        ],
      } as any,
      cookies: { lng: "en" },
      i18n: { language: "en" },
      headers: { "txma-audit-encoded": TXMA_AUDIT_ENCODED },
      query: { intent: INTENT_CHANGE_PHONE_NUMBER },
    };
    res = {
      render: vi.fn(),
      redirect: vi.fn(() => {}),
      status: vi.fn(),
      locals: {
        trace: "trace-id",
      },
    };

    stubMfaClient = {
      update: vi.fn(),
      create: vi.fn(),
    };
    vi.spyOn(mfaClient, "createMfaClient").mockResolvedValue(stubMfaClient);
    vi.spyOn(oidcModule, "refreshToken").mockImplementation(async () => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("checkYourPhonePost with mfa method management API", () => {
    it("should render with the expected error message when an invalid OTP code is entered", async () => {
      req.session.user.state.changePhoneNumber.value = "CHANGE_VALUE";
      req.body.code = "123456";
      req.body.intent = INTENT_CHANGE_PHONE_NUMBER;
      req.session.user.newPhoneNumber = "07111111111";

      stubMfaClient.update.mockResolvedValue({
        success: false,
        error: {
          code: 1020,
          message: "Invalid OTP code",
        },
        status: 200,
        data: [mfaMethod],
      });

      await checkYourPhonePost(req as Request, res as Response);

      expect(stubMfaClient.update).toHaveBeenCalledWith(
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
      expect(res.render).toHaveBeenCalledWith("check-your-phone/index.njk", {
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
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it("should redirect to 'Your services' when the user has the max number of MFA methods' for add MFA methods journey", async () => {
      req.body.code = "123456";
      req.body.intent = INTENT_ADD_BACKUP;
      req.session.user.newPhoneNumber = NEW_PHONE_NUMBER;

      await checkYourPhonePost(req as Request, res as Response);

      expect(stubMfaClient.create).not.toHaveBeenCalled();

      expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.SECURITY.url);
    });

    it("should redirect to /phone-number-updated-confirmation when valid code entered for change phone number journey", async () => {
      req.session.user.state.changePhoneNumber.value = "CHANGE_VALUE";
      req.body.code = "123456";
      req.body.intent = INTENT_CHANGE_PHONE_NUMBER;
      req.session.user.newPhoneNumber = "07111111111";

      stubMfaClient.update.mockResolvedValue({
        success: true,
        status: 200,
        data: [mfaMethod],
      });

      await checkYourPhonePost(req as Request, res as Response);

      expect(stubMfaClient.update).toHaveBeenCalledWith(
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
      expect(res.redirect).toHaveBeenCalledWith(
        PATH_DATA.PHONE_NUMBER_UPDATED_CONFIRMATION.url
      );
    });

    it("should redirect to /phone-number-updated-confirmation when valid code entered for add MFA method journey", async () => {
      req.body.code = "123456";
      req.body.intent = INTENT_ADD_BACKUP;
      req.session.user.newPhoneNumber = NEW_PHONE_NUMBER;
      req.session.mfaMethods = [req.session.mfaMethods[0]];

      stubMfaClient.create.mockResolvedValue({
        success: true,
        status: 200,
        data: mfaMethod,
      });

      await checkYourPhonePost(req as Request, res as Response);

      expect(res.redirect).toHaveBeenCalledWith(
        PATH_DATA.ADD_MFA_METHOD_SMS_CONFIRMATION.url
      );
    });

    it("should redirect to /phone-number-updated-confirmation when valid code entered for change default journey", async () => {
      req.body.code = "123456";
      req.body.intent = INTENT_CHANGE_DEFAULT_METHOD;
      req.session.user.newPhoneNumber = NEW_PHONE_NUMBER;

      stubMfaClient.update.mockResolvedValue({
        success: true,
        status: 200,
        data: [mfaMethod],
      });

      await checkYourPhonePost(req as Request, res as Response);

      expect(res.redirect).toHaveBeenCalledWith(
        PATH_DATA.CHANGE_DEFAULT_METHOD_CONFIRMATION.url
      );
    });

    it("should redirect to 'Your services' when newPhoneNumber is undefined", async () => {
      req.body.code = "123456";
      req.body.intent = INTENT_ADD_BACKUP;
      req.session.user.newPhoneNumber = undefined;

      await checkYourPhonePost(req as Request, res as Response);

      expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.SECURITY.url);
    });

    it("should log an error when intent is not valid", async () => {
      req.session.user.tokens = { accessToken: "token" } as any;
      req.session.user.state.changePhoneNumber.value = "CHANGE_VALUE";
      req.body.code = "123456";
      req.body.intent = "invalid-intent";
      req.session.user.newPhoneNumber = "07111111111";
      req.session.user.email = "test@test.com";

      const errorMessage = `Could not change phone number - unknown intent: ${req.body.intent}`;

      try {
        await checkYourPhonePost(req as Request, res as Response);
      } catch {
        expect(errorLoggerSpy).toHaveBeenCalledWith(
          { trace: res.locals.trace },
          errorMessage
        );
        expect(stubMfaClient.update).not.toHaveBeenCalled();
        expect(stubMfaClient.create).not.toHaveBeenCalled();
      }
    });

    it("should log an error when adding a backup MFA method fails", async () => {
      req.body.code = "123456";
      req.body.intent = INTENT_ADD_BACKUP;
      req.session.user.newPhoneNumber = NEW_PHONE_NUMBER;

      const response = {
        success: false,
        status: 403,
        error: { code: 1, message: "Not authorized" },
        data: {} as MfaMethod,
      };
      stubMfaClient.create.mockResolvedValue(response);

      try {
        await checkYourPhonePost(req as Request, res as Response);
      } catch {
        expect(stubMfaClient.update).not.toHaveBeenCalled();
        expect(errorLoggerSpy).toHaveBeenCalledWith(
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
