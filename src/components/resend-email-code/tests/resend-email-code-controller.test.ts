import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import * as oidcModule from "../../../utils/oidc.js";
import {
  resendEmailCodeGet,
  resendEmailCodePost,
} from "../resend-email-code-controller.js";
import { ChangeEmailServiceInterface } from "../../change-email/types";
import { getInitialState } from "../../../utils/state-machine.js";
import { TXMA_AUDIT_ENCODED } from "../../../../test/utils/builders";
import { HTTP_STATUS_CODES, ERROR_CODES } from "../../../app.constants.js";
import { logger } from "../../../utils/logger.js";

describe("check your email controller", () => {
  let req: Partial<Request>;
  let res: any;

  beforeEach(() => {
    req = {
      body: {},
      session: { user: {} } as any,
      cookies: { lng: "en" },
      i18n: { language: "en" },
      headers: { "txma-audit-encoded": TXMA_AUDIT_ENCODED },
      t: vi.fn((key: string) => key),
    };
    res = {
      render: vi.fn(),
      redirect: vi.fn(() => {}),
      status: vi.fn().mockReturnThis(),
      locals: {},
    };

    vi.spyOn(oidcModule, "refreshToken").mockImplementation(async () => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("resendEmailCodeGet", () => {
    it("should render resend email code view", () => {
      req.session.user = {
        newEmailAddress: "test@test.com",
      } as any;
      resendEmailCodeGet(req as Request, res as Response);

      expect(res.render).toHaveBeenCalledWith("resend-email-code/index.njk", {
        emailAddress: "test@test.com",
      });
    });
  });

  describe("resendEmailCodePost", () => {
    it("should redirect to /check-your-email when get security code is executed successfully", async () => {
      const fakeService: ChangeEmailServiceInterface = {
        sendCodeVerificationNotification: vi
          .fn()
          .mockResolvedValue({ success: true }),
      };

      req.session.user = {
        tokens: { accessToken: "token" },
        email: "test@dl.com",
        newEmailAddress: "test@test.com",
        state: { changeEmail: getInitialState() },
      } as any;
      req.cookies.lng = "en";

      await resendEmailCodePost(fakeService)(req as Request, res as Response);

      expect(
        fakeService.sendCodeVerificationNotification
      ).toHaveBeenCalledOnce();
      expect(res.redirect).toHaveBeenCalledWith("/check-your-email");
    });

    it("should render alreadyInUse validation error when email already exists on resend submission", async () => {
      const fakeService: ChangeEmailServiceInterface = {
        sendCodeVerificationNotification: vi.fn().mockResolvedValue({
          success: false,
          code: ERROR_CODES.ACCT_WITH_EMAIL_EXISTS,
          message: "Account already exists with this email address",
        }),
      };

      req.session.user = {
        tokens: { accessToken: "token" },
        email: "test@dl.com",
        newEmailAddress: "test@test.com",
        state: { changeEmail: getInitialState() },
      } as any;

      await resendEmailCodePost(fakeService)(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.BAD_REQUEST);
      expect(res.render).toHaveBeenCalledWith(
        "resend-email-code/index.njk",
        expect.objectContaining({
          errors: expect.objectContaining({
            email: expect.objectContaining({
              text: "pages.changeEmail.email.validationError.alreadyInUse",
            }),
          }),
        })
      );
    });

    it("should throw error when REQUEST_MISSING_PARAMS is returned", async () => {
      const fakeService: ChangeEmailServiceInterface = {
        sendCodeVerificationNotification: vi.fn().mockResolvedValue({
          success: false,
          code: ERROR_CODES.REQUEST_MISSING_PARAMS,
          message: "Required request parameters are missing",
        }),
      };

      req.session.user = {
        tokens: { accessToken: "token" },
        email: "test@dl.com",
        newEmailAddress: "test@test.com",
        state: { changeEmail: getInitialState() },
      } as any;

      await expect(
        resendEmailCodePost(fakeService)(req as Request, res as Response)
      ).rejects.toThrow(
        "Request missing params. Code: 1001 message: Required request parameters are missing"
      );
    });

    it("should log a warning and render error when INVALID_EMAIL_FORMAT is returned", async () => {
      req.session.user = {
        tokens: { accessToken: "token" },
        email: "test@dl.com",
        newEmailAddress: "test@test.com",
        state: { changeEmail: getInitialState() },
      } as any;
      const logSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
      const fakeService: ChangeEmailServiceInterface = {
        sendCodeVerificationNotification: vi.fn().mockResolvedValue({
          success: false,
          code: ERROR_CODES.INVALID_EMAIL_FORMAT,
          message: "invalid email format",
        }),
      };

      await resendEmailCodePost(fakeService)(req as Request, res as Response);

      expect(logSpy).toHaveBeenCalledWith(
        `Potential Frontend/API validation mismatch detected. API returned INVALID_EMAIL_FORMAT but this should have been validated on AMF: invalid email format`
      );
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.BAD_REQUEST);
      expect(res.render).toHaveBeenCalledWith(
        "resend-email-code/index.njk",
        expect.objectContaining({
          errors: expect.objectContaining({
            email: expect.objectContaining({
              text: "pages.changeEmail.email.validationError.email",
            }),
          }),
        })
      );
    });

    it("should log a warning and render error when EMAIL_ADDRESS_EMPTY", async () => {
      req.session.user = {
        tokens: { accessToken: "token" },
        email: "test@dl.com",
        newEmailAddress: "test@test.com",
        state: { changeEmail: getInitialState() },
      } as any;
      const logSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
      const fakeService: ChangeEmailServiceInterface = {
        sendCodeVerificationNotification: vi.fn().mockResolvedValue({
          success: false,
          code: ERROR_CODES.EMAIL_ADDRESS_EMPTY,
          message: "Email cannot be blank",
        }),
      };

      await resendEmailCodePost(fakeService)(req as Request, res as Response);

      expect(logSpy).toHaveBeenCalledWith(
        `Potential Frontend/API validation mismatch detected. API returned EMAIL_ADDRESS_EMPTY but this should have been validated on AMF: Email cannot be blank`
      );
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.BAD_REQUEST);
      expect(res.render).toHaveBeenCalledWith(
        "resend-email-code/index.njk",
        expect.objectContaining({
          errors: expect.objectContaining({
            email: expect.objectContaining({
              text: "pages.changeEmail.email.validationError.required",
            }),
          }),
        })
      );
    });
  });
});
