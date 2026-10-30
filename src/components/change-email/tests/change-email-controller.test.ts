import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { changeEmailGet, changeEmailPost } from "../change-email-controller.js";
import { ChangeEmailServiceInterface } from "../types";
import { HTTP_STATUS_CODES, ERROR_CODES } from "../../../app.constants";
import {
  ACCOUNT_DATA_API_ACCESS_TOKEN,
  CLIENT_SESSION_ID,
  CURRENT_EMAIL,
  ENGLISH,
  NEW_EMAIL,
  PERSISTENT_SESSION_ID,
  RequestBuilder,
  ResponseBuilder,
  SESSION_ID,
  SOURCE_IP,
  TOKEN,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";
import * as oidcModule from "../../../utils/oidc.js";
import { logger } from "../../../utils/logger.js";

describe("change email controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let fakeService: ChangeEmailServiceInterface;

  beforeEach(() => {
    req = new RequestBuilder()
      .withBody({ email: NEW_EMAIL })
      .withTranslate(vi.fn())
      .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
      .withTranslate((key: string) => key)
      .build();

    res = new ResponseBuilder()
      .withRender(vi.fn())
      .withRedirect(vi.fn(() => {}))
      .withStatus(vi.fn())
      .build();

    fakeService = {
      sendCodeVerificationNotification: vi
        .fn()
        .mockResolvedValue({ success: true }),
    };
    vi.spyOn(oidcModule, "refreshToken").mockImplementation(async () => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("changeEmailGet", () => {
    it("should render enter new email", () => {
      // Act
      changeEmailGet(req as Request, res as Response);

      // Assert
      expect(res.render).toHaveBeenCalledWith("change-email/index.njk");
    });

    it("should render enter new email with email denied error message", () => {
      req.query = { email_cant_be_used: "1" };
      changeEmailGet(req as Request, res as Response);

      expect(res.render).toHaveBeenCalledWith("change-email/index.njk", {
        errors: {
          email: {
            text: "pages.changeEmail.email.validationError.emailCantBeUsed",
            href: "#email",
          },
        },
        errorList: [
          {
            text: "pages.changeEmail.email.validationError.emailCantBeUsed",
            href: "#email",
          },
        ],
        email: "new-email@test.com",
        language: "en",
      });
    });
  });

  describe("changeEmailPost", () => {
    it("should redirect to /check-your-email on submit", async () => {
      await changeEmailPost(fakeService)(req as Request, res as Response);

      expect(
        fakeService.sendCodeVerificationNotification
      ).toHaveBeenCalledTimes(1);
      expect(fakeService.sendCodeVerificationNotification).toHaveBeenCalledWith(
        NEW_EMAIL,
        {
          accountDataApiAccessToken: ACCOUNT_DATA_API_ACCESS_TOKEN,
          token: TOKEN,
          sourceIp: SOURCE_IP,
          sessionId: SESSION_ID,
          persistentSessionId: PERSISTENT_SESSION_ID,
          userLanguage: ENGLISH,
          clientSessionId: CLIENT_SESSION_ID,
          txmaAuditEncoded: TXMA_AUDIT_ENCODED,
        }
      );
      expect(res.redirect).toHaveBeenCalledWith("/check-your-email");
    });

    it("rejects request to change email to existing email address as bad request", async () => {
      // Arrange
      req.body = { email: CURRENT_EMAIL };

      // Act
      await changeEmailPost(fakeService)(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });

    it("should render alreadyInUse validation error when email already exists", async () => {
      fakeService.sendCodeVerificationNotification = vi.fn().mockResolvedValue({
        success: false,
        code: ERROR_CODES.ACCT_WITH_EMAIL_EXISTS,
        message: "Account already exists with this email address",
      });

      await changeEmailPost(fakeService)(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.BAD_REQUEST);
      expect(res.render).toHaveBeenCalledWith(
        "change-email/index.njk",
        expect.objectContaining({
          errors: expect.objectContaining({
            email: expect.objectContaining({
              text: "pages.changeEmail.email.validationError.alreadyInUse",
            }),
          }),
        })
      );
    });

    it("should throw a BadRequestError when critical parameters are missing", async () => {
      const mockErrorMessage = "Required request parameters are missing";
      fakeService.sendCodeVerificationNotification = vi.fn().mockResolvedValue({
        success: false,
        code: ERROR_CODES.REQUEST_MISSING_PARAMS,
        message: mockErrorMessage,
      });

      await expect(
        changeEmailPost(fakeService)(req as Request, res as Response)
      ).rejects.toThrow(mockErrorMessage);
    });

    it("should log a warning and render email validation error when INVALID_EMAIL_FORMAT is received", async () => {
      fakeService.sendCodeVerificationNotification = vi.fn().mockResolvedValue({
        success: false,
        code: ERROR_CODES.INVALID_EMAIL_FORMAT,
        message: "Invalid email",
      });
      const logSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
      await changeEmailPost(fakeService)(req as Request, res as Response);

      expect(logSpy).toHaveBeenCalledWith(
        "Potential Frontend/API validation mismatch detected. API returned INVALID_EMAIL_FORMAT but this should have been validated on AMF: Invalid email"
      );
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.BAD_REQUEST);
      expect(res.render).toHaveBeenCalledWith(
        "change-email/index.njk",
        expect.objectContaining({
          errors: expect.objectContaining({
            email: expect.objectContaining({
              text: "pages.changeEmail.email.validationError.email",
            }),
          }),
        })
      );
    });

    it("should log a warning and render validation error when EMAIL_ADDRESS_EMPTY is received", async () => {
      const logSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

      fakeService.sendCodeVerificationNotification = vi.fn().mockResolvedValue({
        success: false,
        code: ERROR_CODES.EMAIL_ADDRESS_EMPTY,
        message: "Email address cannot be empty",
      });

      await changeEmailPost(fakeService)(req as Request, res as Response);

      expect(logSpy).toHaveBeenCalledWith(
        "Potential Frontend/API validation mismatch detected. API returned EMAIL_ADDRESS_EMPTY but this should have been validated on AMF: Email address cannot be empty"
      );
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.BAD_REQUEST);
      expect(res.render).toHaveBeenCalledWith(
        "change-email/index.njk",
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
