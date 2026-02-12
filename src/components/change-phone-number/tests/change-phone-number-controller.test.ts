import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";

import { ChangePhoneNumberServiceInterface } from "../types";
import { ERROR_CODES, PATH_DATA } from "../../../app.constants";
import {
  changePhoneNumberGet,
  changePhoneNumberPost,
} from "../change-phone-number-controller.js";
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
import * as oidcModule from "../../../utils/oidc.js";

describe("change phone number controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = new RequestBuilder()
      .withBody({})
      .withSessionUserState({ changePhoneNumber: {} })
      .withTranslate(vi.fn())
      .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
      .build();

    res = new ResponseBuilder()
      .withRender(vi.fn())
      .withRedirect(vi.fn(() => {}))
      .withStatus(vi.fn())
      .build();

    vi.spyOn(oidcModule, "refreshToken").mockImplementation(async () => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("changePhoneNumberGet", () => {
    it("should render change phone number page", () => {
      // Act
      changePhoneNumberGet(req as Request, res as Response);

      // Assert
      expect(res.render).toHaveBeenCalledWith("change-phone-number/index.njk");
    });
  });

  describe("changePhoneNumberPost", () => {
    it("should redirect to /phone-number-updated-confirmation page", async () => {
      // Arrange
      const fakeService: ChangePhoneNumberServiceInterface = {
        sendPhoneVerificationNotification: vi.fn().mockResolvedValue({
          success: true,
        }),
      };
      req.body.phoneNumber = "12345678991";
      req.session.user.state.changePhoneNumber.value = "CHANGE_VALUE";

      // Act
      await changePhoneNumberPost(fakeService)(req as Request, res as Response);

      // Assert
      expect(
        fakeService.sendPhoneVerificationNotification
      ).toHaveBeenCalledOnce();
      expect(
        fakeService.sendPhoneVerificationNotification
      ).toHaveBeenCalledWith(CURRENT_EMAIL, "12345678991", {
        token: TOKEN,
        sourceIp: SOURCE_IP,
        sessionId: SESSION_ID,
        persistentSessionId: PERSISTENT_SESSION_ID,
        userLanguage: ENGLISH,
        clientSessionId: CLIENT_SESSION_ID,
        txmaAuditEncoded: TXMA_AUDIT_ENCODED,
      });
      expect(res.redirect).toHaveBeenCalledWith(
        `${PATH_DATA.CHECK_YOUR_PHONE.url}?intent=changePhoneNumber`
      );
    });

    it("should return validation error when same UK number", async () => {
      // Arrange
      const fakeService: ChangePhoneNumberServiceInterface = {
        sendPhoneVerificationNotification: vi.fn().mockResolvedValue({
          success: false,
          code: ERROR_CODES.NEW_PHONE_NUMBER_SAME_AS_EXISTING,
        }),
      };
      req.session.user.tokens = { accessToken: "token" } as any;
      req.body.phoneNumber = "12345678991";

      // Act
      await changePhoneNumberPost(fakeService)(req as Request, res as Response);

      // Assert
      expect(fakeService.sendPhoneVerificationNotification).toHaveBeenCalled();
      expect(
        fakeService.sendPhoneVerificationNotification
      ).toHaveBeenCalledWith(CURRENT_EMAIL, "12345678991", {
        token: TOKEN,
        sourceIp: SOURCE_IP,
        sessionId: SESSION_ID,
        persistentSessionId: PERSISTENT_SESSION_ID,
        userLanguage: ENGLISH,
        clientSessionId: CLIENT_SESSION_ID,
        txmaAuditEncoded: TXMA_AUDIT_ENCODED,
      });
      expect(res.render).toHaveBeenCalledWith("change-phone-number/index.njk", {
        errorList: [
          {
            href: "#phoneNumber",
            text: undefined,
          },
        ],
        errors: {
          phoneNumber: {
            href: "#phoneNumber",
            text: undefined,
          },
        },
        language: "en",
        phoneNumber: "12345678991",
      });
    });

    it("should return validation error when same international number", async () => {
      // Arrange
      const fakeService: ChangePhoneNumberServiceInterface = {
        sendPhoneVerificationNotification: vi.fn().mockResolvedValue({
          success: false,
          code: ERROR_CODES.NEW_PHONE_NUMBER_SAME_AS_EXISTING,
        }),
      };
      req.body.phoneNumber = "12345678991";
      req.body.hasInternationalPhoneNumber = true;

      // Act
      await changePhoneNumberPost(fakeService)(req as Request, res as Response);

      // Assert
      expect(fakeService.sendPhoneVerificationNotification).toHaveBeenCalled();
      expect(
        fakeService.sendPhoneVerificationNotification
      ).toHaveBeenCalledWith(CURRENT_EMAIL, "12345678991", {
        token: TOKEN,
        sourceIp: SOURCE_IP,
        sessionId: SESSION_ID,
        persistentSessionId: PERSISTENT_SESSION_ID,
        userLanguage: ENGLISH,
        clientSessionId: CLIENT_SESSION_ID,
        txmaAuditEncoded: TXMA_AUDIT_ENCODED,
      });
      expect(res.render).toHaveBeenCalledWith("change-phone-number/index.njk", {
        errorList: [
          {
            href: "#phoneNumber",
            text: undefined,
          },
        ],
        errors: {
          phoneNumber: {
            href: "#phoneNumber",
            text: undefined,
          },
        },
        hasInternationalPhoneNumber: true,
        language: "en",
        phoneNumber: "12345678991",
      });
    });

    it("should redirect to /phone-number-updated-confirmation when success with valid international number", async () => {
      // Arrange
      const fakeService: ChangePhoneNumberServiceInterface = {
        sendPhoneVerificationNotification: vi.fn().mockResolvedValue({
          success: true,
        }),
      };
      req.body.phoneNumber = "+33645453322";
      req.session.user.state.changePhoneNumber.value = "CHANGE_VALUE";
      // Act
      await changePhoneNumberPost(fakeService)(req as Request, res as Response);

      // Assert
      expect(
        fakeService.sendPhoneVerificationNotification
      ).toHaveBeenCalledOnce();
      expect(
        fakeService.sendPhoneVerificationNotification
      ).toHaveBeenCalledWith(CURRENT_EMAIL, "+33645453322", {
        token: TOKEN,
        sourceIp: SOURCE_IP,
        sessionId: SESSION_ID,
        persistentSessionId: PERSISTENT_SESSION_ID,
        userLanguage: ENGLISH,
        clientSessionId: CLIENT_SESSION_ID,
        txmaAuditEncoded: TXMA_AUDIT_ENCODED,
      });
      expect(res.redirect).toHaveBeenCalledWith(
        `${PATH_DATA.CHECK_YOUR_PHONE.url}?intent=changePhoneNumber`
      );
    });
  });
});
