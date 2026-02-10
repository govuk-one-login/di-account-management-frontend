import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { Session, SessionData } from "express-session";

import { ChangePhoneNumberServiceInterface } from "../types";
import { ERROR_CODES, PATH_DATA } from "../../../app.constants";
import {
  changePhoneNumberGet,
  changePhoneNumberPost,
  noUkPhoneNumberGet,
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
import * as oidcModule from "../../../utils/oidc";

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

    sandbox.replace(oidcModule, "refreshToken", async () => {});
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
      ).to.have.been.calledWithExactly(CURRENT_EMAIL, "12345678991", {
        token: TOKEN,
        sourceIp: SOURCE_IP,
        sessionId: SESSION_ID,
        persistentSessionId: PERSISTENT_SESSION_ID,
        userLanguage: ENGLISH,
        clientSessionId: CLIENT_SESSION_ID,
        txmaAuditEncoded: TXMA_AUDIT_ENCODED,
      });
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
      ).to.have.been.calledWithExactly(CURRENT_EMAIL, "12345678991", {
        token: TOKEN,
        sourceIp: SOURCE_IP,
        sessionId: SESSION_ID,
        persistentSessionId: PERSISTENT_SESSION_ID,
        userLanguage: ENGLISH,
        clientSessionId: CLIENT_SESSION_ID,
        txmaAuditEncoded: TXMA_AUDIT_ENCODED,
      });
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
      ).to.have.been.calledWithExactly(CURRENT_EMAIL, "12345678991", {
        token: TOKEN,
        sourceIp: SOURCE_IP,
        sessionId: SESSION_ID,
        persistentSessionId: PERSISTENT_SESSION_ID,
        userLanguage: ENGLISH,
        clientSessionId: CLIENT_SESSION_ID,
        txmaAuditEncoded: TXMA_AUDIT_ENCODED,
      });
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
      ).to.have.been.calledWithExactly(CURRENT_EMAIL, "+33645453322", {
        token: TOKEN,
        sourceIp: SOURCE_IP,
        sessionId: SESSION_ID,
        persistentSessionId: PERSISTENT_SESSION_ID,
        userLanguage: ENGLISH,
        clientSessionId: CLIENT_SESSION_ID,
        txmaAuditEncoded: TXMA_AUDIT_ENCODED,
      });
      expect(res.redirect).to.have.calledWith(
        `${PATH_DATA.CHECK_YOUR_PHONE.url}?intent=changePhoneNumber`
      );
    });
  });

  describe("noUkPhoneNumberGet", () => {
    it("should render no uk phone number page", () => {
      // Arrange
      req = new RequestBuilder()
        .withBody({})
        .withSessionUserState({ changePhoneNumber: {} })
        .withTranslate(sandbox.fake())
        .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
        .withQuery({ type: "changePhoneNumber" })
        .build();

      // Act
      noUkPhoneNumberGet(req as Request, res as Response);

      // Assert
      expect(res.render).to.have.calledWith(
        "change-phone-number/no-uk-phone-number.njk",
        { hasBackupAuthApp: false }
      );
    });

    it("should redirect to same page with type query param if not present", () => {
      // Arrange
      req = new RequestBuilder()
        .withBody({})
        .withSessionUserState({ changePhoneNumber: {} })
        .withTranslate(sandbox.fake())
        .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
        .build();

      (req as any).path = PATH_DATA.NO_UK_PHONE_NUMBER.url;

      // Act
      noUkPhoneNumberGet(req as Request, res as Response);

      // Assert
      expect(res.redirect).to.have.calledWith(
        `${PATH_DATA.NO_UK_PHONE_NUMBER.url}?type=unknownType`
      );
    });

    it("should redirect with ?type=changePhoneNumber query param if origin is change phone number path", () => {
      // Arrange
      req = new RequestBuilder()
        .withBody({})
        .withSessionUserState({ changePhoneNumber: {} })
        .withTranslate(sandbox.fake())
        .withHeaders({
          "txma-audit-encoded": TXMA_AUDIT_ENCODED,
          referer: PATH_DATA.CHANGE_PHONE_NUMBER.url,
        })
        .withQuery({ type: "" })
        .build();

      // Act
      noUkPhoneNumberGet(req as Request, res as Response);

      // Assert
      expect(res.redirect).to.have.calledWith(
        `${PATH_DATA.NO_UK_PHONE_NUMBER.url}?type=changePhoneNumber`
      );
    });

    it("should redirect with ?type=changeDefaultMethod query param if origin is change default method path", () => {
      // Arrange
      req = new RequestBuilder()
        .withBody({})
        .withSessionUserState({ changePhoneNumber: {} })
        .withTranslate(sandbox.fake())
        .withHeaders({
          "txma-audit-encoded": TXMA_AUDIT_ENCODED,
          referer: PATH_DATA.CHANGE_DEFAULT_METHOD.url,
        })
        .withQuery({ type: "" })
        .build();

      // Act
      noUkPhoneNumberGet(req as Request, res as Response);

      // Assert
      expect(res.redirect).to.have.calledWith(
        `${PATH_DATA.NO_UK_PHONE_NUMBER.url}?type=changeDefaultMethod`
      );
    });

    it("should render no uk phone number page with hasBackupAuthApp true when user has auth app as backup", () => {
      // Arrange
      const sessionData = {
        changePhoneNumber: {},
        mfaMethods: [{ method: { mfaMethodType: "AUTH_APP" } }],
      };

      req = new RequestBuilder()
        .withBody({})
        .withSessionUserState(sessionData)
        .withTranslate(sandbox.fake())
        .withHeaders({
          "txma-audit-encoded": TXMA_AUDIT_ENCODED,
          referer: PATH_DATA.CHANGE_PHONE_NUMBER.url,
        })
        .withQuery({ type: "changePhoneNumber" })
        .build();

      // esllint-disable-next-line no-console
      console.log(req.session?.mfaMethods);

      // Act
      noUkPhoneNumberGet(req as Request, res as Response);

      // Assert
      expect(res.render).to.have.calledWith(
        "change-phone-number/no-uk-phone-number.njk",
        { hasBackupAuthApp: true }
      );
    });
  });
});
