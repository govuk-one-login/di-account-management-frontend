import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import { ChangeAuthenticatorAppServiceInterface } from "../types";
import { PATH_DATA } from "../../../app.constants";
import {
  changeAuthenticatorAppGet,
  changeAuthenticatorAppPost,
} from "../change-authenticator-app-controller";
import {
  RequestBuilder,
  ResponseBuilder,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";
import * as mfaModule from "../../../utils/mfa";
import QRCode from "qrcode";

describe("change authenticator app controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = new RequestBuilder()
      .withBody({})
      .withSessionUserState({ changeAuthenticatorApp: {} })
      .withTimestampT(sandbox.fake())
      .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
      .build();

    res = new ResponseBuilder()
      .withRender(sandbox.fake())
      .withRedirect(sandbox.fake(() => {}))
      .withStatus(sandbox.fake())
      .build();
  });

  afterEach(() => {
    sandbox.restore();
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
            state: { changeAuthenticatorApp: ["VALUE_UPDATED"] },
          },
        },
        log: { error: sinon.fake() },
        ip: "127.0.0.1",
        t: (t: string) => t,
      };
      const res = {
        locals: {
          persistentSessionId: "persistentSessionId",
        },
        render: sandbox.fake(),
        redirect: sandbox.fake(() => {}),
      };
      const next = sinon.spy();

      sandbox.replace(mfaModule, "generateMfaSecret", () => "A".repeat(20));
      sandbox.replace(mfaModule, "generateQRCodeValue", () => "qrcode");

      await changeAuthenticatorAppGet(
        req as unknown as Request,
        res as unknown as Response,
        next
      );

      expect(res.render).to.have.been.calledWith(
        "change-authenticator-app/index.njk",
        {
          authAppSecret: "A".repeat(20),
          qrCode: await QRCode.toDataURL("qrcode"),
          formattedSecret: "AAAA AAAA AAAA AAAA AAAA",
          errors: undefined,
          errorList: undefined,
        }
      );
    });
  });

  describe("changeAuthenticatorAppPost", () => {
    it("should return validation error when auth app secret is not set", async () => {
      // Arrange
      const fakeService: ChangeAuthenticatorAppServiceInterface = {
        updateAuthenticatorApp: sandbox.fake.resolves(true),
      };
      req.session.user.tokens = { accessToken: "token" } as any;
      req.session.mfaMethods = [
        {
          mfaIdentifier: 111111,
          methodVerified: true,
          method: {
            mfaMethodType: "SMS",
            endPoint: "PHONE",
          },
          priorityIdentifier: "DEFAULT",
        },
        {
          mfaIdentifier: 2,
          priorityIdentifier: "BACKUP",
          method: {
            mfaMethodType: "AUTH_APP",
          },
          methodVerified: true,
        },
      ];
      req.body.code = "111111";
      let errorOccurred = false;

      // Act
      try {
        await changeAuthenticatorAppPost(fakeService)(
          req as Request,
          res as Response
        );
      } catch (error) {
        errorOccurred = true;
      }

      // Assert
      expect(errorOccurred).to.be.true;
      expect(fakeService.updateAuthenticatorApp).to.not.have.been.calledOnce;
      expect(res.redirect).to.not.have.calledWith(
        PATH_DATA.AUTHENTICATOR_APP_UPDATED_CONFIRMATION.url
      );
    });

    it("should redirect to /authenticator-app-updated-confirmation page", async () => {
      // Arrange
      const fakeService: ChangeAuthenticatorAppServiceInterface = {
        updateAuthenticatorApp: sandbox.fake.resolves(true),
      };
      req.session.user.tokens = { accessToken: "token" } as any;
      req.session.user.state.changeAuthenticatorApp.value = "CHANGE_VALUE";
      req.session.mfaMethods = [
        {
          mfaIdentifier: 111111,
          methodVerified: true,
          method: {
            endPoint: "PHONE",
            mfaMethodType: "SMS",
          },
          priorityIdentifier: "DEFAULT",
        },
        {
          mfaIdentifier: 2,
          priorityIdentifier: "BACKUP",
          method: {
            mfaMethodType: "AUTH_APP",
          },
          methodVerified: true,
        },
      ];
      req.body.code = "111111";
      req.body.authAppSecret = "qwer42312345342";

      sandbox.replace(mfaModule, "generateMfaSecret", () => "A".repeat(20));
      sandbox.replace(mfaModule, "generateQRCodeValue", () => "qrcode");

      sandbox.replace(mfaModule, "verifyMfaCode", () => true);

      // Act
      await changeAuthenticatorAppPost(fakeService)(
        req as Request,
        res as Response
      );

      // Assert
      expect(fakeService.updateAuthenticatorApp).to.have.been.calledOnce;
      expect(res.redirect).to.have.calledWith(
        PATH_DATA.AUTHENTICATOR_APP_UPDATED_CONFIRMATION.url
      );
    });

    it("should render an error if the code is invalid", async () => {
      const fakeService: ChangeAuthenticatorAppServiceInterface = {
        updateAuthenticatorApp: sandbox.fake.resolves(true),
      };
      req.session.user.tokens = { accessToken: "token" } as any;
      req.body.code = "11111";
      req.body.authAppSecret = "qwer42312345342";

      sandbox.replace(mfaModule, "generateMfaSecret", () => "A".repeat(20));
      sandbox.replace(mfaModule, "generateQRCodeValue", () => "qrcode");

      sandbox.replace(mfaModule, "verifyMfaCode", () => true);

      await changeAuthenticatorAppPost(fakeService)(
        req as Request,
        res as Response
      );

      expect(res.render).to.have.been.calledWith(
        "change-authenticator-app/index.njk",
        {
          authAppSecret: "qwer42312345342",
          qrCode: await QRCode.toDataURL("qrcode"),
          formattedSecret: "qwer 4231 2345 342",
          errors: { code: { text: undefined, href: "#code" } },
          errorList: [{ text: undefined, href: "#code" }],
        }
      );
      expect(fakeService.updateAuthenticatorApp).to.not.have.been.calledOnce;
    });
  });
});
