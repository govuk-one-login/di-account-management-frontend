import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";

import {
  changePasswordGet,
  changePasswordPost,
} from "../change-password-controller.js";
import { ChangePasswordServiceInterface } from "../types";
import * as oidcModule from "../../../utils/oidc.js";

import {
  ERROR_CODES,
  HTTP_STATUS_CODES,
  PATH_DATA,
} from "../../../app.constants";
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
import { ApiResponseResult } from "../../../utils/types";

describe("change password controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let fakeChangePasswordService: ChangePasswordServiceInterface;

  beforeEach(() => {
    req = new RequestBuilder()
      .withBody({})
      .withSessionUserState({ changePassword: {} })
      .withTranslate(vi.fn())
      .withHeaders({
        "txma-audit-encoded": TXMA_AUDIT_ENCODED,
      })
      .build();

    res = new ResponseBuilder()
      .withRender(vi.fn())
      .withRedirect(vi.fn(() => {}))
      .withStatus(vi.fn())
      .build();

    fakeChangePasswordService = {
      updatePassword: vi.fn().mockReturnValue({
        success: true,
      } as unknown as Promise<ApiResponseResult>),
    };

    vi.spyOn(oidcModule, "refreshToken").mockImplementation(async () => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("changePasswordGet", () => {
    it("should render change password page", () => {
      changePasswordGet(req as Request, res as Response);

      expect(res.render).toHaveBeenCalledWith("change-password/index.njk");
    });
  });

  describe("changePasswordPost", () => {
    it("should redirect to /password-updated-confirmation page", async () => {
      // Arrange
      req.session.user.tokens = { accessToken: "token" } as any;
      req.session.user.state.changePassword.value = "CHANGE_VALUE";
      req.body.password = "Password1";

      // Act
      await changePasswordPost(fakeChangePasswordService)(
        req as Request,
        res as Response
      );

      // Assert
      expect(fakeChangePasswordService.updatePassword).toHaveBeenCalledOnce();
      expect(fakeChangePasswordService.updatePassword).toHaveBeenCalledWith(
        CURRENT_EMAIL,
        "Password1",
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
      expect(res.redirect).toHaveBeenCalledWith(
        PATH_DATA.PASSWORD_UPDATED_CONFIRMATION.url
      );
    });

    it("should render bad request when password are same", async () => {
      // Arrange
      const fakeFailingChangePasswordService: ChangePasswordServiceInterface = {
        updatePassword: vi.fn().mockResolvedValue({
          success: false,
          code: ERROR_CODES.NEW_PASSWORD_SAME_AS_EXISTING,
          message: "",
        }),
      };

      // Act
      await changePasswordPost(fakeFailingChangePasswordService)(
        req as Request,
        res as Response
      );

      // Assert
      expect(
        fakeFailingChangePasswordService.updatePassword
      ).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });

    it("should render bad request when password is common", async () => {
      // Arrange
      const fakeFailingChangePasswordService: ChangePasswordServiceInterface = {
        updatePassword: vi.fn().mockResolvedValue({
          success: false,
          code: ERROR_CODES.PASSWORD_IS_COMMON,
          message: "",
        }),
      };
      req.session.user.tokens = { accessToken: "token" } as any;

      // Act
      await changePasswordPost(fakeFailingChangePasswordService)(
        req as Request,
        res as Response
      );

      // Assert
      expect(
        fakeFailingChangePasswordService.updatePassword
      ).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });
  });
});
