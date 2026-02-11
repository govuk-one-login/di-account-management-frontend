import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { changeEmailGet, changeEmailPost } from "../change-email-controller.js";
import { ChangeEmailServiceInterface } from "../types";
import { HTTP_STATUS_CODES } from "../../../app.constants";
import {
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
        .mockReturnValue(true as unknown as Promise<boolean>),
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
      // Act
      await changeEmailPost(fakeService)(req as Request, res as Response);

      // Assert
      expect(
        fakeService.sendCodeVerificationNotification
      ).toHaveBeenCalledTimes(1);
      expect(fakeService.sendCodeVerificationNotification).toHaveBeenCalledWith(
        NEW_EMAIL,
        {
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

      // Assert
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });
  });
});
