import request from "supertest";
import { describe } from "mocha";
import { sinon } from "../../../../test/utils/test-utils";
import nock = require("nock");
import decache from "decache";
import {
  API_ENDPOINTS,
  CLIENT_SESSION_ID_UNKNOWN,
  NOTIFICATION_TYPE,
  PATH_DATA,
} from "../../../app.constants";
import { UnsecuredJWT } from "jose";
import { checkFailedCSRFValidationBehaviour } from "../../../../test/utils/behaviours";
import * as cheerio from "cheerio";
import { expect } from "chai";

describe("Integration:: request email code", () => {
  let token: string | string[];
  let cookies: string;
  let sandbox: sinon.SinonSandbox;
  let app: any;
  let baseApi: string;

  const TEST_SUBJECT_ID = "jkduasd";

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
          newEmailAddress: "new@test.com",
          phoneNumber: "07839490040",
          subjectId: TEST_SUBJECT_ID,
          isAuthenticated: true,
          state: {
            changeEmail: {
              value: "CHANGE_VALUE",
              events: ["VALUE_UPDATED", "VERIFY_CODE_SENT"],
            },
          },
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
        next();
      });

    const oidc = require("../../../utils/oidc");
    sandbox.stub(oidc, "getOIDCClient").callsFake(() => {
      return Promise.resolve({});
    });

    sandbox.stub(oidc, "getCachedJWKS").callsFake(() => {
      return Promise.resolve({});
    });

    app = await require("../../../app").createApp();
    baseApi = process.env.AM_API_BASE_URL;

    await request(app)
      .get(PATH_DATA.RESEND_EMAIL_CODE.url)
      .then((res) => {
        const $ = cheerio.load(res.text);
        token = $("[name=_csrf]").val();
        cookies = res.headers["set-cookie"];
      });
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  after(() => {
    sandbox.restore();
    app = undefined;
  });

  it("should return resend email code page", (done) => {
    request(app).get(PATH_DATA.RESEND_EMAIL_CODE.url).expect(200, done);
  });

  it("should redirect to your services when csrf not present", async () => {
    await checkFailedCSRFValidationBehaviour(
      app,
      PATH_DATA.RESEND_EMAIL_CODE.url,
      {
        code: "123456",
      }
    );
  });

  it("should resend email when submitted", async () => {
    // Arrange
    let receivedEmail: string;
    nock(baseApi)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .post(API_ENDPOINTS.SEND_NOTIFICATION, {
        email: "new@test.com",
        notificationType: "VERIFY_EMAIL",
      })
      .reply(
        204,
        (
          uri,
          requestBody: {
            email: string;
            notificationType: NOTIFICATION_TYPE.VERIFY_EMAIL;
          }
        ) => {
          receivedEmail = requestBody.email;
          return {};
        }
      );

    // Act
    await request(app)
      .post(PATH_DATA.RESEND_EMAIL_CODE.url)
      .type("form")
      .set("Cookie", cookies)
      .send({ _csrf: token })
      .expect(302);

    // Assert
    expect(receivedEmail).to.equal("new@test.com");
  });
});
