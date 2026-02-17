import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { PATH_DATA } from "../../../app.constants.js";
import {
  changeAuthenticatorAppGet,
  changeAuthenticatorAppPost,
} from "../change-authenticator-app-controller.js";
import {
  RequestBuilder,
  ResponseBuilder,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders.js";
import * as mfaModule from "../../../utils/mfa/index.js";
import * as mfaClient from "../../../utils/mfaClient/index.js";
import { MfaMethod } from "../../../utils/mfaClient/types.js";

describe("change authenticator app controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = new RequestBuilder()
      .withBody({})
      .withSessionUserState({ changeAuthApp: {} })
      .withTranslate(vi.fn())
      .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
      .build();

    res = new ResponseBuilder()
      .withRender(vi.fn())
      .withRedirect(vi.fn(() => {}))
      .withStatus(vi.fn())
      .build();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("changeAuthenticatorAppGet", () => {
    it("should render change authenticator app page", async () => {
      const req = {
        body: {
          code: "qrcode",
          authAppSecret: "A".repeat(20),
        },
        session: {
          id: "session_id",
          user: {
            email: "test@test.com",
            tokens: { accessToken: "token" },
            state: { changeAuthApp: ["VALUE_UPDATED"] },
          },
        },
        log: { error: vi.fn() },
        ip: "127.0.0.1",
        t: (t: string) => t,
      };
      const res = {
        locals: {
          persistentSessionId: "persistentSessionId",
        },
        render: vi.fn(),
        redirect: vi.fn(() => {}),
      };
      const next = vi.fn();

      vi.spyOn(mfaModule, "generateMfaSecret").mockReturnValue("A".repeat(20));
      vi.spyOn(mfaModule, "generateQRCodeValue").mockReturnValue("qrcode");

      await changeAuthenticatorAppGet(
        req as unknown as Request,
        res as unknown as Response,
        next
      );

      expect(res.render).toHaveBeenCalledWith(
        "change-authenticator-app/index.njk",
        {
          authAppSecret: "A".repeat(20),
          qrCode: expect.any(String),
          formattedSecret: "AAAA AAAA AAAA AAAA AAAA",
          backLink: undefined,
          errors: undefined,
          errorList: undefined,
        }
      );
    });
  });

  describe("changeAuthenticatorAppPost", () => {
    let mfaClientStub: any;

    beforeEach(() => {
      req.body.code = "123456";
      req.body.authAppSecret = "qwer42312345342";
      req.body.qrCode = "qrcode";
      req.session.mfaMethods = [
        {
          mfaIdentifier: "1",
          methodVerified: true,
          method: {
            mfaMethodType: "SMS",
            phoneNumber: "070",
          },
          priorityIdentifier: "DEFAULT",
        },
        {
          mfaIdentifier: "2",
          priorityIdentifier: "BACKUP",
          method: {
            mfaMethodType: "AUTH_APP",
            credential: "ABC",
          },
          methodVerified: true,
        },
      ];

      mfaClientStub = {
        update: vi.fn(),
      };
      vi.spyOn(mfaClient, "createMfaClient").mockResolvedValue(mfaClientStub);
    });

    it("should return validation error when auth app secret is not set", async () => {
      req.body.authAppSecret = "";
      let errorOccurred = false;
      // Act
      try {
        await changeAuthenticatorAppPost(
          req as Request,
          res as Response,
          () => {}
        );
      } catch {
        errorOccurred = true;
      }

      // Assert
      expect(errorOccurred).toBe(true);
      expect(mfaClientStub.update).not.toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalledWith(
        PATH_DATA.AUTHENTICATOR_APP_UPDATED_CONFIRMATION.url
      );
    });

    it("should redirect to /authenticator-app-updated-confirmation page", async () => {
      req.session.user.state.changeAuthApp = { value: "CHANGE_VALUE" };
      mfaClientStub.update.mockResolvedValue({
        success: true,
        status: 200,
        data: [],
      });
      vi.spyOn(mfaModule, "verifyMfaCode").mockResolvedValue(true);

      // Act
      await changeAuthenticatorAppPost(
        req as Request,
        res as Response,
        () => {}
      );

      // Assert
      expect(mfaClientStub.update).toHaveBeenCalledOnce();
      expect(res.redirect).toHaveBeenCalledWith(
        PATH_DATA.AUTHENTICATOR_APP_UPDATED_CONFIRMATION.url
      );
    });

    it("should render an error if the code is empty", async () => {
      req.body.code = "";
      const tSpy = vi.fn();
      req.t = tSpy;
      vi.spyOn(mfaModule, "verifyMfaCode").mockResolvedValue(true);

      await changeAuthenticatorAppPost(
        req as Request,
        res as Response,
        () => {}
      );

      expect(res.render).toHaveBeenCalledWith(
        "change-authenticator-app/index.njk",
        {
          authAppSecret: "qwer42312345342",
          qrCode: expect.any(String),
          formattedSecret: "qwer 4231 2345 342",
          backLink: undefined,
          errors: { code: { text: undefined, href: "#code" } },
          errorList: [{ text: undefined, href: "#code" }],
        }
      );
      expect(mfaClientStub.update).not.toHaveBeenCalled();
      expect(tSpy).toHaveBeenCalledOnce();
      expect(tSpy).toHaveBeenCalledWith("setUpAuthApp.errors.required");
    });

    it("should render an error if the code is invalid", async () => {
      vi.spyOn(mfaModule, "verifyMfaCode").mockResolvedValue(false);

      await changeAuthenticatorAppPost(
        req as Request,
        res as Response,
        () => {}
      );

      expect(res.render).toHaveBeenCalledWith(
        "change-authenticator-app/index.njk",
        {
          authAppSecret: "qwer42312345342",
          qrCode: expect.any(String),
          formattedSecret: "qwer 4231 2345 342",
          backLink: undefined,
          errors: { code: { text: undefined, href: "#code" } },
          errorList: [{ text: undefined, href: "#code" }],
        }
      );
      expect(mfaClientStub.update).not.toHaveBeenCalled();
    });

    it("should render an error if the code contains letters", async () => {
      req.body.code = "abc123";
      vi.spyOn(mfaModule, "verifyMfaCode").mockResolvedValue(true);

      await changeAuthenticatorAppPost(
        req as Request,
        res as Response,
        () => {}
      );

      expect(res.render).toHaveBeenCalledWith(
        "change-authenticator-app/index.njk",
        {
          authAppSecret: "qwer42312345342",
          qrCode: expect.any(String),
          formattedSecret: "qwer 4231 2345 342",
          backLink: undefined,
          errors: { code: { text: undefined, href: "#code" } },
          errorList: [{ text: undefined, href: "#code" }],
        }
      );
      expect(mfaClientStub.update).not.toHaveBeenCalled();
    });

    it("should throw an error if there's no current auth app method", async () => {
      vi.spyOn(mfaModule, "verifyMfaCode").mockResolvedValue(true);
      req.session.mfaMethods = [
        {
          mfaIdentifier: "111111",
          methodVerified: true,
          method: {
            mfaMethodType: "SMS",
            phoneNumber: "070",
          },
          priorityIdentifier: "DEFAULT",
        },
      ];

      await expect(
        changeAuthenticatorAppPost(req as Request, res as Response, () => {})
      ).rejects.toThrow(
        "Could not change authenticator app - no existing auth app method found"
      );
    });

    it("should throw an error if the API response fails", async () => {
      vi.spyOn(mfaModule, "verifyMfaCode").mockResolvedValue(true);
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
        changeAuthenticatorAppPost(req as Request, res as Response, () => {})
      ).rejects.toThrow(
        mfaClient.formatErrorMessage(
          "Could not change authenticator app",
          response
        )
      );
    });
  });
});
