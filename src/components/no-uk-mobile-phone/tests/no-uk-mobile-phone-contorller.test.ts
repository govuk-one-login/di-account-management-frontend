import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import { PATH_DATA } from "../../../app.constants";

import {
  RequestBuilder,
  ResponseBuilder,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";
import * as oidcModule from "../../../utils/oidc";

import { noUkPhoneNumberGet } from "../no-uk-mobile-phone-controller";

describe("NoUkMobilePhoneController", () => {
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
      expect(res.render).to.have.calledWith("no-uk-mobile-phone/index.njk", {
        hasBackupAuthApp: false,
        hasAuthApp: false,
      });
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
      req = new RequestBuilder()
        .withBody({})
        .withSessionUserState({
          changePhoneNumber: {},
        })
        .withBackupAuthAppMfaMethod()
        .withTranslate(sandbox.fake())
        .withHeaders({
          "txma-audit-encoded": TXMA_AUDIT_ENCODED,
          referer: PATH_DATA.CHANGE_PHONE_NUMBER.url,
        })
        .withQuery({ type: "changePhoneNumber" })
        .build();

      // Act
      noUkPhoneNumberGet(req as Request, res as Response);

      // Assert
      expect(res.render).to.have.calledWith("no-uk-mobile-phone/index.njk", {
        hasBackupAuthApp: true,
        hasAuthApp: false,
      });
    });

    it("should render no uk phone number page with hasAuthApp true when user has auth app as default", () => {
      // Arrange
      req = new RequestBuilder()
        .withBody({})
        .withSessionUserState({
          changePhoneNumber: {},
        })
        .withAuthAppMfaMethod()
        .withTranslate(sandbox.fake())
        .withHeaders({
          "txma-audit-encoded": TXMA_AUDIT_ENCODED,
          referer: PATH_DATA.CHANGE_PHONE_NUMBER.url,
        })
        .withQuery({ type: "changePhoneNumber" })
        .build();

      // Act
      noUkPhoneNumberGet(req as Request, res as Response);

      // Assert
      expect(res.render).to.have.calledWith("no-uk-mobile-phone/index.njk", {
        hasBackupAuthApp: false,
        hasAuthApp: true,
      });
    });
  });
});
