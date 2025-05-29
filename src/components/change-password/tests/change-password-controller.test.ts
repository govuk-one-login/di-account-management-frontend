import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import {
  changePasswordGet,
  changePasswordPost,
} from "../change-password-controller";
import { ChangePasswordServiceInterface } from "../types";

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
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let fakeChangePasswordService: ChangePasswordServiceInterface;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = new RequestBuilder()
      .withBody({})
      .withSessionUserState({ changePassword: {} })
      .withTranslate(sandbox.fake())
      .withHeaders({
        "txma-audit-encoded": TXMA_AUDIT_ENCODED,
      })
      .build();

    res = new ResponseBuilder()
      .withRender(sandbox.fake())
      .withRedirect(sandbox.fake(() => {}))
      .withStatus(sandbox.fake())
      .build();

    fakeChangePasswordService = {
      updatePassword: sandbox.fake.returns({
        success: true,
      } as unknown as Promise<ApiResponseResult>),
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("changePasswordGet", () => {
    it("should render change password page", () => {
      changePasswordGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("change-password/index.njk");
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
      expect(fakeChangePasswordService.updatePassword).to.have.been.calledOnce;
      expect(
        fakeChangePasswordService.updatePassword
      ).to.have.been.calledWithExactly(CURRENT_EMAIL, "Password1", {
        token: TOKEN,
        sourceIp: SOURCE_IP,
        sessionId: SESSION_ID,
        persistentSessionId: PERSISTENT_SESSION_ID,
        userLanguage: ENGLISH,
        clientSessionId: CLIENT_SESSION_ID,
        txmaAuditEncoded: TXMA_AUDIT_ENCODED,
      });
      expect(res.redirect).to.have.calledWith(
        PATH_DATA.PASSWORD_UPDATED_CONFIRMATION.url
      );
    });

    it("should render bad request when password are same ", async () => {
      // Arrange
      const fakeFailingChangePasswordService: ChangePasswordServiceInterface = {
        updatePassword: sandbox.fake.resolves({
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
      expect(fakeFailingChangePasswordService.updatePassword).to.have.been
        .called;
      expect(res.status).to.have.calledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });

    it("should render bad request when password is common ", async () => {
      // Arrange
      const fakeFailingChangePasswordService: ChangePasswordServiceInterface = {
        updatePassword: sandbox.fake.resolves({
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
      expect(fakeFailingChangePasswordService.updatePassword).to.have.been
        .called;
      expect(res.status).to.have.calledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });
  });
});
