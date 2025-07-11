import request from "supertest";
import { describe } from "mocha";
import { sinon, expect } from "../../../../test/utils/test-utils";
import * as cheerio from "cheerio";
import decache from "decache";
import { PATH_DATA } from "../../../app.constants";
import { UnsecuredJWT } from "jose";
import { checkFailedCSRFValidationBehaviour } from "../../../../test/utils/behaviours";

describe("Integration:: change authenticator app", () => {
  let token: string | string[];

  let cookies: string;
  let sandbox: sinon.SinonSandbox;
  let app: Awaited<ReturnType<typeof appWithMiddlewareSetup>>;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    app = await appWithMiddlewareSetup();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should return change authenticator app page if feature flag is on", async () => {
    await request(app)
      .get(PATH_DATA.CHANGE_AUTHENTICATOR_APP.url)
      .expect((res) => {
        const $ = cheerio.load(res.text);
        token = $("[name=_csrf]").val();
        cookies = res.headers["set-cookie"];
        expect(res.status).to.equal(200);
      });
  });

  it("should redirect to your services when csrf not present", async () => {
    await checkFailedCSRFValidationBehaviour(
      app,
      PATH_DATA.CHANGE_AUTHENTICATOR_APP.url,
      {
        code: "123456",
      }
    );
  });

  it("should redirect to /update confirmation when valid code entered", async () => {
    await request(app)
      .get(PATH_DATA.CHANGE_AUTHENTICATOR_APP.url)
      .expect((res) => {
        const $ = cheerio.load(res.text);
        token = $("[name=_csrf]").val();
        cookies = res.headers["set-cookie"];
      });

    await request(app)
      .post(PATH_DATA.CHANGE_AUTHENTICATOR_APP.url)
      .type("form")
      .send({
        _csrf: token,
        code: "111111",
        authAppSecret: "qwer42312345342",
      })
      .set("Cookie", cookies)
      .then((res) => {
        expect(res.headers.location).to.equal(
          PATH_DATA.AUTHENTICATOR_APP_UPDATED_CONFIRMATION.url
        );
        expect(res.status).to.equal(302);
      });
  });

  const appWithMiddlewareSetup = async (config: any = {}) => {
    decache("../../../app");
    decache("../../../middleware/requires-auth-middleware");
    const sessionMiddleware = require("../../../middleware/requires-auth-middleware");
    const configFuncs = require("../../../config");
    const mfaModule = require("../../../utils/mfa");

    sandbox
      .stub(sessionMiddleware, "requiresAuthMiddleware")
      .callsFake(function (req: any, res: any, next: any): void {
        req.session.user = {
          email: "test@test.com",
          state: {
            changeAuthApp: {
              value: "CHANGE_VALUE",
              events: ["VALUE_UPDATED", "CONFIRMATION"],
            },
          },
          isAuthenticated: true,
          tokens: {
            accessToken: new UnsecuredJWT({})
              .setIssuedAt()
              .setSubject("12345")
              .setIssuer("urn:example:issuer")
              .setAudience("urn:example:audience")
              .setExpirationTime("2h")
              .encode(),
            idToken: "Idtoken",
            refreshToken: "token",
          },
        };
        req.body = {
          code: "111111",
          authAppSecret: "A".repeat(20),
        };

        req.session.mfaMethods = [
          {
            mfaIdentifier: 111111,
            methodVerified: true,
            phoneNumber: "070",
            method: {
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
        next();
      });

    const oidc = require("../../../utils/oidc");
    sandbox.stub(oidc, "getOIDCClient").callsFake(() => {
      return Promise.resolve({});
    });

    sandbox.stub(oidc, "getCachedJWKS").callsFake(() => {
      return Promise.resolve({});
    });

    sandbox.replace(mfaModule, "generateMfaSecret", () => "A".repeat(20));
    sandbox.replace(mfaModule, "generateQRCodeValue", () => "qrcode");

    sandbox.replace(mfaModule, "verifyMfaCode", () => {
      return true;
    });

    sandbox.stub(configFuncs, "getMfaServiceUrl").callsFake(() => {
      return "https://method-management-v1-stub.home.build.account.gov.uk/v1";
    });

    sandbox.stub(configFuncs, "supportChangeMfa").callsFake(() => {
      return !config.hideChangeMfa;
    });

    sandbox.stub(configFuncs, "supportMfaManagement").callsFake(() => {
      return true;
    });

    return await require("../../../app").createApp();
  };
});
