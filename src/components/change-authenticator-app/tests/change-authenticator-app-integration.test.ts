import request from "supertest";
import { describe } from "mocha";
import { sinon, expect } from "../../../../test/utils/test-utils";
import * as cheerio from "cheerio";
import decache from "decache";
import { PATH_DATA } from "../../../app.constants";
import { UnsecuredJWT } from "jose";
import { checkFailedCSRFValidationBehaviour } from "../../../../test/utils/behaviours";
import { CLIENT_SESSION_ID, SESSION_ID } from "../../../../test/utils/builders";
import * as mfaModule from "../../../utils/mfa";

describe("Integration:: change authenticator app", () => {
  let token: string | string[];

  let cookies: string;
  const sandbox = sinon.createSandbox();

  after(() => {
    sandbox.restore();
  });

  it("should return change authenticator app page if feature flag is on", async () => {
    const app = await appWithMiddlewareSetup();
    request(app)
      .get(PATH_DATA.CHANGE_AUTHENTICATOR_APP.url)
      .expect((res) => {
        const $ = cheerio.load(res.text);
        token = $("[name=_csrf]").val();
        cookies = res.headers["set-cookie"].concat(
          `gs=${SESSION_ID}.${CLIENT_SESSION_ID}`
        );
        expect(res.status).to.equal(200);
      });
  });

  it("should not return change authenticator app page if feature flag is off", async () => {
    const app = await appWithMiddlewareSetup({ hideChangeMfa: true });

    await request(app)
      .get(PATH_DATA.CHANGE_AUTHENTICATOR_APP.url)
      .then((res) => {
        const $ = cheerio.load(res.text);
        token = $("[name=_csrf]").val();
        cookies = res.headers["set-cookie"].concat(
          `gs=${SESSION_ID}.${CLIENT_SESSION_ID}`
        );
        expect(res.status).to.equal(404);
      });
  });

  it("should redirect to your services when csrf not present", async () => {
    const app = await appWithMiddlewareSetup();
    await checkFailedCSRFValidationBehaviour(
      app,
      PATH_DATA.CHANGE_AUTHENTICATOR_APP.url,
      {
        code: "123456",
      }
    );
  });

  it.only("should redirect to /update confirmation when valid code entered", async () => {
    const app = await appWithMiddlewareSetup({ verifyMfaCode: true });

    await request(app)
      .get(PATH_DATA.CHANGE_AUTHENTICATOR_APP.url)
      .then((res) => {
        const $ = cheerio.load(res.text);
        token = $("[name=_csrf]").val();
        cookies = res.headers["set-cookie"].concat(
          `gs=${SESSION_ID}.${CLIENT_SESSION_ID}`
        );
        console.log("TOKEN VALUE", token);
      })
      .then(() => {
        console.log("2nd TOKEN VALUE", token);
        return request(app)
          .post(PATH_DATA.CHANGE_AUTHENTICATOR_APP.url)
          .type("form")
          .set("Cookie", cookies)
          .send({
            _csrf: token,
            code: "111111",
            authAppSecret: "qwer42312345342",
          });
      })
      .then((res) => {
        expect(res.header.location).to.equal(
          PATH_DATA.AUTHENTICATOR_APP_UPDATED_CONFIRMATION.url
        );
        expect(res.status).to.equal(302);
      });
  });

  const appWithMiddlewareSetup = async (config: any = {}) => {
    decache("../../../app");
    decache("../../../middleware/requires-auth-middleware");
    const sessionMiddleware = require("../../../middleware/requires-auth-middleware");
    const sandbox = sinon.createSandbox();
    const configFuncs = require("../../../config");
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
          code: "qrcode",
          authAppSecret: "A".repeat(20),
        };

        (req.session.mfaMethods = [
          {
            mfaIdentifier: 111111,
            methodVerified: true,
            phoneNumber: "070",
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

    sandbox.stub(oidc, "getCachedJWKS").callsFake(() => {
      return new Promise((resolve) => {
        resolve({});
      });
    });

    sandbox.replace(mfaModule, "generateMfaSecret", () => "A".repeat(20));
    sandbox.replace(mfaModule, "generateQRCodeValue", () => "qrcode");

    if (config.verifyMfaCode) {
      sandbox.replace(mfaModule, "verifyMfaCode", () => true);
    }

    sandbox.stub(configFuncs, "getMfaServiceUrl").callsFake(() => {
      return "https://method-management-v1-stub.home.build.account.gov.uk";
    });
    sandbox.stub(configFuncs, "supportChangeMfa").callsFake(() => {
      return !config.hideChangeMfa;
    });

    sandbox.stub(configFuncs, "supportMfaPage").callsFake(() => {
      return true;
    });

    return await require("../../../app").createApp();
  };
});
