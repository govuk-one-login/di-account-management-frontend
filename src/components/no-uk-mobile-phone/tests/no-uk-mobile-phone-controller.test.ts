import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { PATH_DATA } from "../../../app.constants.js";
import {
  RequestBuilder,
  ResponseBuilder,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders.js";
import * as oidcModule from "../../../utils/oidc.js";
import { noUkPhoneNumberGet } from "../no-uk-mobile-phone-controller.js";

describe("NoUkMobilePhoneController", () => {
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
      .withRedirect(vi.fn())
      .withStatus(vi.fn())
      .build();

    vi.spyOn(oidcModule, "refreshToken").mockImplementation(async () => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("noUkPhoneNumberGet", () => {
    it("should render no uk phone number page", () => {
      // Arrange
      req = new RequestBuilder()
        .withBody({})
        .withSessionUserState({ changePhoneNumber: {} })
        .withTranslate(vi.fn())
        .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
        .withQuery({ type: "changePhoneNumber" })
        .build();

      // Act
      noUkPhoneNumberGet(req as Request, res as Response);

      // Assert
      expect(res.render).toHaveBeenCalledWith("no-uk-mobile-phone/index.njk", {
        hasBackupAuthApp: false,
        hasAuthApp: false,
      });
    });

    it("should redirect to same page with type query param if not present", () => {
      // Arrange
      req = new RequestBuilder()
        .withBody({})
        .withSessionUserState({ changePhoneNumber: {} })
        .withTranslate(vi.fn())
        .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
        .build();

      (req as any).path = PATH_DATA.NO_UK_PHONE_NUMBER.url;

      // Act
      noUkPhoneNumberGet(req as Request, res as Response);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith(
        `${PATH_DATA.NO_UK_PHONE_NUMBER.url}?type=unknownType`
      );
    });

    it("should redirect with ?type=changePhoneNumber query param if origin is change phone number path", () => {
      // Arrange
      req = new RequestBuilder()
        .withBody({})
        .withSessionUserState({ changePhoneNumber: {} })
        .withTranslate(vi.fn())
        .withHeaders({
          "txma-audit-encoded": TXMA_AUDIT_ENCODED,
          referer: PATH_DATA.CHANGE_PHONE_NUMBER.url,
        })
        .withQuery({ type: "" })
        .build();

      // Act
      noUkPhoneNumberGet(req as Request, res as Response);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith(
        `${PATH_DATA.NO_UK_PHONE_NUMBER.url}?type=changePhoneNumber`
      );
    });

    it("should redirect with ?type=changeDefaultMethod query param if origin is change default method path", () => {
      // Arrange
      req = new RequestBuilder()
        .withBody({})
        .withSessionUserState({ changePhoneNumber: {} })
        .withTranslate(vi.fn())
        .withHeaders({
          "txma-audit-encoded": TXMA_AUDIT_ENCODED,
          referer: PATH_DATA.CHANGE_DEFAULT_METHOD.url,
        })
        .withQuery({ type: "" })
        .build();

      // Act
      noUkPhoneNumberGet(req as Request, res as Response);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith(
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
        .withTranslate(vi.fn())
        .withHeaders({
          "txma-audit-encoded": TXMA_AUDIT_ENCODED,
          referer: PATH_DATA.CHANGE_PHONE_NUMBER.url,
        })
        .withQuery({ type: "changePhoneNumber" })
        .build();

      // Act
      noUkPhoneNumberGet(req as Request, res as Response);

      // Assert
      expect(res.render).toHaveBeenCalledWith("no-uk-mobile-phone/index.njk", {
        hasBackupAuthApp: true,
        hasAuthApp: false,
      });
    });

    it.each([
      ["changePhoneNumber", "6e807956-3e2c-4fcf-a11a-e6d19c98593d"],
      ["changeDefaultMethod", "40b345e2-4b21-47b1-ab10-36cd9374eede"],
      ["unknownType", "4f8fcc9d-d8c3-4746-9093-90cb05e89c79"],
    ])("should set opl contentId for type %s", (type, expectedContentId) => {
      // Arrange
      req = new RequestBuilder()
        .withBody({})
        .withSessionUserState({ changePhoneNumber: {} })
        .withTranslate(vi.fn())
        .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
        .withQuery({ type })
        .build();

      // Act
      noUkPhoneNumberGet(req as Request, res as Response);

      // Assert
      expect(res.locals?.opl.contentId).toBe(expectedContentId);
    });

    it("should set opl contentId to undefined for an unrecognised type", () => {
      // Arrange
      req = new RequestBuilder()
        .withBody({})
        .withSessionUserState({ changePhoneNumber: {} })
        .withTranslate(vi.fn())
        .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
        .withQuery({ type: "somethingElse" })
        .build();

      // Act
      noUkPhoneNumberGet(req as Request, res as Response);

      // Assert
      expect(res.locals?.opl.contentId).toBe("undefined");
    });

    it("should render no uk phone number page with hasAuthApp true when user has auth app as default", () => {
      // Arrange
      req = new RequestBuilder()
        .withBody({})
        .withSessionUserState({
          changePhoneNumber: {},
        })
        .withAuthAppMfaMethod()
        .withTranslate(vi.fn())
        .withHeaders({
          "txma-audit-encoded": TXMA_AUDIT_ENCODED,
          referer: PATH_DATA.CHANGE_PHONE_NUMBER.url,
        })
        .withQuery({ type: "changePhoneNumber" })
        .build();

      // Act
      noUkPhoneNumberGet(req as Request, res as Response);

      // Assert
      expect(res.render).toHaveBeenCalledWith("no-uk-mobile-phone/index.njk", {
        hasBackupAuthApp: false,
        hasAuthApp: true,
      });
    });
  });
});
