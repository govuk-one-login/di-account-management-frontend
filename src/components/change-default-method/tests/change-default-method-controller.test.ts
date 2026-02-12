import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";

import {
  changeDefaultMethodAppPost,
  changeDefaultMethodGet,
  changeDefaultMethodSmsGet,
  changeDefaultMethodSmsPost,
  changeDefaultMethodAppGet,
} from "../change-default-method-controllers";
import {
  RequestBuilder,
  ResponseBuilder,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";
import * as mfaModule from "../../../utils/mfa/index.js";
import * as commonMfaModule from "../../common/mfa/index.js";
import * as mfaClient from "../../../utils/mfaClient/index.js";
import { MfaMethod } from "../../../utils/mfaClient/types";
import { ERROR_CODES, PATH_DATA } from "../../../app.constants";
import { ChangePhoneNumberServiceInterface } from "../../change-phone-number/types";
import * as oidcModule from "../../../utils/oidc.js";

describe("change default method controller", () => {
  let req: object;
  let res: Partial<Response>;
  let mfaClientStub: any;
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    req = new RequestBuilder()
      .withBody({ code: "123456", authAppSecret: "A".repeat(20) })
      .withSessionUserState({ changeDefaultMethod: { value: "APP" } })
      .withTranslate(vi.fn())
      .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
      .withMfaMethods()
      .build();

    res = new ResponseBuilder()
      .withRender(vi.fn())
      .withRedirect(vi.fn(() => {}))
      .withStatus(vi.fn())
      .withLocals({})
      .build();

    mfaClientStub = {
      update: vi.fn(),
      create: vi.fn(),
    };
    vi.spyOn(mfaClient, "createMfaClient").mockResolvedValue(mfaClientStub);
    next = vi.fn();

    vi.spyOn(oidcModule, "refreshToken").mockImplementation(async () => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("changeDefaultMethodGet", () => {
    it("should correctly render the page", async () => {
      //@ts-expect-error in test
      req.session = {
        mfaMethods: [
          {
            priorityIdentifier: "DEFAULT",
            method: {
              mfaMethodType: "SMS",
              phoneNumber: "12345678",
            },
          },
        ],
      };
      await changeDefaultMethodGet(
        req as unknown as Request,
        res as unknown as Response
      );
      expect(res.render).toHaveBeenCalledWith(
        "change-default-method/index.njk",
        {
          currentMethodType: "SMS",
          phoneNumber: "5678",
        }
      );
    });

    it("should return 404 if there is no default method", async () => {
      //@ts-expect-error in test
      req.session = { mfaMethods: [] };

      await changeDefaultMethodGet(
        req as unknown as Request,
        res as unknown as Response
      );

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("changeDefaultMethodAppPost", () => {
    it("should redirect to confirmation page when successful", async () => {
      vi.spyOn(mfaModule, "verifyMfaCode").mockImplementation(async () => true);
      mfaClientStub.update.mockResolvedValue({
        success: true,
        status: 200,
        data: [],
      });

      await changeDefaultMethodAppPost(
        req as unknown as Request,
        res as unknown as Response,
        next
      );

      expect(res.redirect).toHaveBeenCalledWith(
        PATH_DATA.CHANGE_DEFAULT_METHOD_CONFIRMATION.url
      );
      expect(mfaClientStub.update).toHaveBeenCalledOnce();
    });

    it("should return error if there is no code entered", async () => {
      //@ts-expect-error in test
      req.body.code = null;

      vi.spyOn(mfaModule, "verifyMfaCode").mockImplementation(async () => true);

      await changeDefaultMethodAppPost(
        req as unknown as Request,
        res as unknown as Response,
        next
      );

      expect(res.render).toHaveBeenCalledWith(
        "change-default-method/change-to-app.njk",
        expect.objectContaining({
          errors: expect.objectContaining({
            code: expect.objectContaining({
              href: "#code",
            }),
          }),
        })
      );
    });

    it("should return an error if the code is less than 6 chars", async () => {
      //@ts-expect-error in test
      req.body.code = "1234";
      vi.spyOn(mfaModule, "verifyMfaCode").mockImplementation(async () => true);

      await changeDefaultMethodAppPost(
        req as unknown as Request,
        res as unknown as Response,
        next
      );

      expect(res.render).toHaveBeenCalledWith(
        "change-default-method/change-to-app.njk",
        expect.objectContaining({
          errors: expect.objectContaining({
            code: expect.objectContaining({
              href: "#code",
            }),
          }),
        })
      );
    });

    it("should return an error if the code is entered wrong", async () => {
      vi.spyOn(mfaModule, "verifyMfaCode").mockImplementation(
        async () => false
      );

      await changeDefaultMethodAppPost(
        req as unknown as Request,
        res as unknown as Response,
        next
      );

      expect(res.render).toHaveBeenCalledWith(
        "change-default-method/change-to-app.njk",
        expect.objectContaining({
          errors: expect.objectContaining({
            code: expect.objectContaining({
              href: "#code",
            }),
          }),
        })
      );
    });

    it("should throw an error when a user has no current default method", async () => {
      vi.spyOn(mfaModule, "verifyMfaCode").mockImplementation(async () => true);
      req = new RequestBuilder()
        .withBody({ code: "123456", authAppSecret: "A".repeat(20) })
        .withSessionUserState({ changeDefaultMethod: { value: "APP" } })
        .withTranslate(vi.fn())
        .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
        .withNoDefaultMfaMethods()
        .build();

      await expect(
        changeDefaultMethodAppPost(
          req as unknown as Request,
          res as unknown as Response,
          next
        )
      ).rejects.toThrow(
        "Could not change default method - no current default method found"
      );
    });

    it("should throw an error when the API call fails", async () => {
      vi.spyOn(mfaModule, "verifyMfaCode").mockImplementation(async () => true);
      const response = {
        success: false,
        status: 400,
        data: [] as MfaMethod[],
        error: {
          code: 1,
          message: "Bad request",
        },
      };
      mfaClientStub.update.mockResolvedValue(response);

      await expect(
        changeDefaultMethodAppPost(
          req as unknown as Request,
          res as unknown as Response,
          next
        )
      ).rejects.toThrow(
        mfaClient.formatErrorMessage(
          "Could not change default method",
          response
        )
      );
    });
  });

  describe("changeDefaultMethodAppGet", () => {
    it("should render the app page correctly", async () => {
      vi.spyOn(commonMfaModule, "renderMfaMethodPage");
      const next = () => {};
      await changeDefaultMethodAppGet(
        req as unknown as Request,
        res as unknown as Response,
        next
      );
      expect(commonMfaModule.renderMfaMethodPage).toHaveBeenCalledWith(
        "change-default-method/change-to-app.njk",
        req,
        res,
        next,
        undefined,
        "/change-default-method"
      );
    });
  });

  describe("changeDefaultMethodSmsGet", () => {
    it("should render the sms page correctly", async () => {
      await changeDefaultMethodSmsGet(
        req as unknown as Request,
        res as unknown as Response
      );
      expect(res.render).toHaveBeenCalledWith(
        "change-default-method/change-to-sms.njk",
        { backLink: "/change-default-method" }
      );
    });
  });

  describe("changeDefaultMethodSmsPost", () => {
    it("should send phone verification number correctly", async () => {
      const serviceMock: ChangePhoneNumberServiceInterface = {
        sendPhoneVerificationNotification: vi.fn().mockReturnValue({
          success: true,
        }),
      };

      const handler = changeDefaultMethodSmsPost(serviceMock);

      await handler(req as unknown as Request, res as unknown as Response);

      expect(res.redirect).toHaveBeenCalledWith(
        "/check-your-phone?intent=changeDefaultMethod"
      );
    });

    it("should show an error if the user tries to use the same number", async () => {
      const serviceMock: ChangePhoneNumberServiceInterface = {
        sendPhoneVerificationNotification: vi.fn().mockReturnValue({
          success: false,
          code: ERROR_CODES.NEW_PHONE_NUMBER_SAME_AS_EXISTING,
        }),
      };

      const handler = changeDefaultMethodSmsPost(serviceMock);

      await handler(req as unknown as Request, res as unknown as Response);

      expect(res.render).toHaveBeenCalledWith(
        "change-default-method/change-to-sms.njk",
        expect.objectContaining({
          errors: expect.objectContaining({
            phoneNumber: expect.objectContaining({
              href: "#phoneNumber",
            }),
          }),
        })
      );
    });
  });
});
