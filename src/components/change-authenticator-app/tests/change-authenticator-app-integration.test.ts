import request from "supertest";
import { describe } from "mocha";
import { sinon } from "../../../../test/utils/test-utils";
import * as cheerio from "cheerio";
import decache from "decache";
import { PATH_DATA } from "../../../app.constants";
import { UnsecuredJWT } from "jose";
import { checkFailedCSRFValidationBehaviour } from "../../../../test/utils/behaviours";
import { CLIENT_SESSION_ID, SESSION_ID } from "../../../../test/utils/builders";
import * as mfaModule from "../../../utils/mfa";

describe("Integration:: change authenticator app", () => {
  let sandbox: sinon.SinonSandbox;
  let token: string | string[];
  let cookies: string;
  let app: any;

  before(async () => {
    decache("../../../app");
    decache("../../../middleware/requires-auth-middleware");
    const sessionMiddleware = require("../../../middleware/requires-auth-middleware");
    sandbox = sinon.createSandbox();
    sandbox
      .stub(sessionMiddleware, "requiresAuthMiddleware")
      .callsFake(function (req: any, res: any, next: any): void {
        req.session.user = {
          email: "test@test.com",
          state: {
            changeAuthenticatorApp: {
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
          code: "qrcode",
          authAppSecret: "A".repeat(20),
        };

        (req.session.mfaMethods = [
          {
            mfaIdentifier: 111111,
            methodVerified: true,
            endPoint: "PHONE",
            mfaMethodType: "SMS",
            priorityIdentifier: "DEFAULT",
          },
          {
            mfaIdentifier: 2,
            priorityIdentifier: "BACKUP",
            mfaMethodType: "AUTH_APP",
            methodVerified: true,
          },
        ]),
          next();
      });

    const oidc = require("../../../utils/oidc");
    sandbox.stub(oidc, "getOIDCClient").callsFake(() => {
      return new Promise((resolve) => {
        resolve({});
      });
    });

    sandbox.stub(oidc, "getJWKS").callsFake(() => {
      return new Promise((resolve) => {
        resolve({});
      });
    });

    sandbox.replace(mfaModule, "generateMfaSecret", () => "A".repeat(20));
    sandbox.replace(mfaModule, "generateQRCodeValue", () => "qrcode");

    app = await require("../../../app").createApp();

    const configFuncs = require("../../../config");

    sandbox.stub(configFuncs, "getMfaServiceUrl").callsFake(() => {
      return "https://method-management-v1-stub.home.build.account.gov.uk";
    });
    sandbox.stub(configFuncs, "supportChangeMfa").callsFake(() => {
      return true;
    });
    sandbox.stub(configFuncs, "supportMfaPage").callsFake(() => {
      return true;
    });

    await request(app)
      .get(PATH_DATA.CHANGE_AUTHENTICATOR_APP.url)
      .then((res) => {
        const $ = cheerio.load(res.text);
        token = $("[name=_csrf]").val();
        cookies = res.headers["set-cookie"].concat(
          `gs=${SESSION_ID}.${CLIENT_SESSION_ID}`
        );
      });
  });

  beforeEach(() => {});

  after(() => {
    sandbox.restore();
    app = undefined;
  });

  it("should return change authenticator app page", (done) => {
    request(app).get(PATH_DATA.CHANGE_AUTHENTICATOR_APP.url).expect(200, done);
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

  it("should redirect to /update confirmation when valid code entered", () => {
    sandbox.replace(mfaModule, "verifyMfaCode", () => true);

    // Act
    request(app)
      .post(PATH_DATA.CHANGE_AUTHENTICATOR_APP.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "111111",
        authAppSecret: "qwer42312345342",
      })
      .expect("Location", PATH_DATA.AUTHENTICATOR_APP_UPDATED_CONFIRMATION.url)
      .expect(302);
  });
});
