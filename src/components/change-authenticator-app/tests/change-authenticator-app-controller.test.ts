import { expect } from "chai";
import { describe } from "mocha";
import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
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
import * as mfaClient from "../../../utils/mfaClient";
import QRCode from "qrcode";
import { MfaMethod } from "../../../utils/mfaClient/types";

describe("change authenticator app controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = new RequestBuilder()
      .withBody({})
      .withSessionUserState({ changeAuthApp: {} })
      .withTranslate(sinon.fake())
      .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
      .build();

    res = new ResponseBuilder()
      .withRender(sinon.fake())
      .withRedirect(sinon.fake(() => {}))
      .withStatus(sinon.fake())
      .build();
  });

  afterEach(() => {
    sinon.restore();
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
        log: { error: sinon.fake() },
        ip: "127.0.0.1",
        t: (t: string) => t,
      };
      const res = {
        locals: {
          persistentSessionId: "persistentSessionId",
        },
        render: sinon.fake(),
        redirect: sinon.fake(() => {}),
      };
      const next = sinon.spy();

      sinon.replace(mfaModule, "generateMfaSecret", () => "A".repeat(20));
      sinon.replace(mfaModule, "generateQRCodeValue", () => "qrcode");

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
          backLink: undefined,
          errors: undefined,
          errorList: undefined,
        }
      );
    });
  });

  describe("changeAuthenticatorAppPost", () => {
    let mfaClientStub: sinon.SinonStubbedInstance<mfaClient.MfaClient>;

    beforeEach(() => {
      mfaClientStub = sinon.createStubInstance(mfaClient.MfaClient);
      sinon.replace(mfaClient, "createMfaClient", () =>
        Promise.resolve(mfaClientStub)
      );
      sinon.replace(mfaModule, "generateMfaSecret", () => "A".repeat(20));
      sinon.replace(mfaModule, "generateQRCodeValue", () => "qrcode");

      req.body.code = "111111";
      req.body.authAppSecret = "qwer42312345342";
      req.session.user.state.changeAuthApp.value = "CHANGE_VALUE";
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
      expect(errorOccurred).to.be.true;
      expect(mfaClientStub.update).to.not.have.been.called;
      expect(res.redirect).to.not.have.calledWith(
        PATH_DATA.AUTHENTICATOR_APP_UPDATED_CONFIRMATION.url
      );
    });

    it("should redirect to /authenticator-app-updated-confirmation page", async () => {
      mfaClientStub.update.resolves({ success: true, status: 200, data: [] });
      sinon.replace(mfaModule, "verifyMfaCode", async () => true);

      // Act
      await changeAuthenticatorAppPost(
        req as Request,
        res as Response,
        () => {}
      );

      // Assert
      expect(mfaClientStub.update).to.have.been.calledOnce;
      expect(res.redirect).to.have.calledWith(
        PATH_DATA.AUTHENTICATOR_APP_UPDATED_CONFIRMATION.url
      );
    });

    it("should render an error if the code is empty", async () => {
      req.body.code = "";
      const tSpy = sinon.spy();
      req.t = tSpy;
      sinon.replace(mfaModule, "verifyMfaCode", async () => true);

      await changeAuthenticatorAppPost(
        req as Request,
        res as Response,
        () => {}
      );

      expect(res.render).to.have.been.calledWith(
        "change-authenticator-app/index.njk",
        {
          authAppSecret: "qwer42312345342",
          qrCode: await QRCode.toDataURL("qrcode"),
          formattedSecret: "qwer 4231 2345 342",
          backLink: undefined,
          errors: { code: { text: undefined, href: "#code" } },
          errorList: [{ text: undefined, href: "#code" }],
        }
      );
      expect(mfaClientStub.update).to.not.have.been.called;
      expect(tSpy).to.have.been.calledOnceWith("setUpAuthApp.errors.required");
    });

    it("should render an error if the code is invalid", async () => {
      sinon.replace(mfaModule, "verifyMfaCode", async () => false);

      await changeAuthenticatorAppPost(
        req as Request,
        res as Response,
        () => {}
      );

      expect(res.render).to.have.been.calledWith(
        "change-authenticator-app/index.njk",
        {
          authAppSecret: "qwer42312345342",
          qrCode: await QRCode.toDataURL("qrcode"),
          formattedSecret: "qwer 4231 2345 342",
          backLink: undefined,
          errors: { code: { text: undefined, href: "#code" } },
          errorList: [{ text: undefined, href: "#code" }],
        }
      );
      expect(mfaClientStub.update).to.not.have.been.called;
    });

    it("should render an error if the code contains letters ", async () => {
      req.body.code = "abc123";
      sinon.replace(mfaModule, "verifyMfaCode", async () => true);

      await changeAuthenticatorAppPost(
        req as Request,
        res as Response,
        () => {}
      );

      expect(res.render).to.have.been.calledWith(
        "change-authenticator-app/index.njk",
        {
          authAppSecret: "qwer42312345342",
          qrCode: await QRCode.toDataURL("qrcode"),
          formattedSecret: "qwer 4231 2345 342",
          backLink: undefined,
          errors: { code: { text: undefined, href: "#code" } },
          errorList: [{ text: undefined, href: "#code" }],
        }
      );
      expect(mfaClientStub.update).to.not.have.been.called;
    });

    it("should throw an error if there's no current auth app method ", async () => {
      sinon.replace(mfaModule, "verifyMfaCode", async () => true);
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

      expect(
        changeAuthenticatorAppPost(req as Request, res as Response, () => {})
      ).to.eventually.be.rejectedWith(
        "Could not change authenticator app - no existing auth app method found"
      );
    });

    it("should throw an error if the API response fails ", async () => {
      sinon.replace(mfaModule, "verifyMfaCode", async () => true);
      const response = {
        success: false,
        status: 400,
        data: [] as MfaMethod[],
        error: {
          code: 1,
          message: "Bad request",
        },
      };
      mfaClientStub.update.resolves(response);

      expect(
        changeAuthenticatorAppPost(req as Request, res as Response, () => {})
      ).to.eventually.be.rejectedWith(
        mfaClient.formatErrorMessage(
          "Could not change authenticator app",
          response
        )
      );
    });
  });
});
