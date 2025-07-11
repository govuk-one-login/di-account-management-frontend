import request from "supertest";
import { describe } from "mocha";
import { expect, sinon } from "../../../../test/utils/test-utils";
import { testComponent } from "../../../../test/utils/helpers";
import nock = require("nock");
import * as cheerio from "cheerio";
import decache from "decache";
import {
  API_ENDPOINTS,
  CLIENT_SESSION_ID_UNKNOWN,
  NOTIFICATION_TYPE,
  PATH_DATA,
} from "../../../app.constants";
import { UnsecuredJWT } from "jose";
import { checkFailedCSRFValidationBehaviour } from "../../../../test/utils/behaviours";

describe("Integration:: change email", () => {
  let sandbox: sinon.SinonSandbox;
  let token: string | string[];
  let cookies: string;
  let app: any;
  let baseApi: string;
  let oidc: { getOIDCClient: any };
  let oidcGetCachedJWKS: { getCachedJWKS: any };

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

    oidc = require("../../../utils/oidc");
    sandbox.stub(oidc, "getOIDCClient").callsFake(() => {
      return Promise.resolve({});
    });

    oidcGetCachedJWKS = require("../../../utils/oidc");
    sandbox.stub(oidcGetCachedJWKS, "getCachedJWKS").callsFake(() => {
      return Promise.resolve({});
    });

    app = await require("../../../app").createApp();
    baseApi = process.env.AM_API_BASE_URL;

    await request(app)
      .get(PATH_DATA.CHANGE_EMAIL.url)
      .query({ type: "changeEmail" })
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

  it("should return change email page", (done) => {
    request(app).get(PATH_DATA.CHANGE_EMAIL.url).expect(200, done);
  });

  it("should redirect to Your services when csrf not present", async () => {
    await checkFailedCSRFValidationBehaviour(app, PATH_DATA.CHANGE_EMAIL.url, {
      email: "123456",
    });
  });

  it("should return validation error when email not entered", async () => {
    await request(app)
      .post(PATH_DATA.CHANGE_EMAIL.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        email: "",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("email-error")).text()).to.contains(
          "Enter your email address"
        );
      })
      .expect(400);
  });

  it("should return validation error when email too long", async () => {
    await request(app)
      .post(PATH_DATA.CHANGE_EMAIL.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        email:
          "grbweuiieugbui4bg4gbuiebruiebguirebguirebguirebgiurebgirebuigrbuigrebguierbgrbweuiieugbui4bg4gbuiebruiebguirebguirebguirebgiurebgirebuigrbuigrebguierbgrbweuiieugbui4bg4gbuiebruiebguirebguirebguirebgiurebgirebuigrbuigrebguierbgrbweuiieugbui4bg4gbuiebruiebguirebguirebguirebgiurebgirebuigrbuigrebguierbgrbweuiieugbui4bg4gbuiebruiebguirebguirebguirebgiurebgirebuigrbuigrebguierbgrbweuiieugbui4bg4gbuiebruiebguirebguirebguirebgiurebgirebuigrbuigrebguierbgrbweuiieugbui4bg4gbuiebruiebguirebguirebguirebgiurebgirebuigrbuigrebguierb@gmail.com",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("email-error")).text()).to.contains(
          "Email address must be 256 characters or fewer"
        );
      })
      .expect(400);
  });

  it("should return validation error when invalid email entered", async () => {
    await request(app)
      .post(PATH_DATA.CHANGE_EMAIL.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        email: "INVALID",
      })
      .expect(function (res) {
        const page = cheerio.load(res.text);
        expect(page(testComponent("email-error")).text()).to.contains(
          "Enter an email address in the correct format, like name@example.com"
        );
      })
      .expect(400);
  });

  it("should return validation error when same email used", async () => {
    await request(app)
      .post(PATH_DATA.CHANGE_EMAIL.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        email: "test@test.com",
      })
      .expect(function (res) {
        const page = cheerio.load(res.text);
        expect(page(testComponent("email-error")).text()).to.contains(
          "You are already using that email address. Enter a different email address."
        );
      })
      .expect(400);
  });

  it("should return validation error when same email used by another user", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.SEND_NOTIFICATION)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(400, {});

    // Act
    await request(app)
      .post(PATH_DATA.CHANGE_EMAIL.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        email: "test1@test1.com",
      })
      .expect(function (res) {
        const page = cheerio.load(res.text);
        expect(page(testComponent("email-error")).text()).to.contains(
          "There’s already a GOV.UK One Login using that email address. Enter a different email address."
        );
      })
      .expect(400);
  });

  it("should redirect to /check-your-email when valid email", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.SEND_NOTIFICATION)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(204, {});

    // Act
    await request(app)
      .post(PATH_DATA.CHANGE_EMAIL.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        email: "test1@test.com",
      })
      .expect("Location", PATH_DATA.CHECK_YOUR_EMAIL.url)
      .expect(302);
  });

  describe("Email Normalization Tests", () => {
    let receivedEmail: string;

    const performTest = async (
      inputEmail: string,
      expectedNormalisedEmail: string
    ) => {
      // Arrange
      nock(baseApi)
        .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
        .post(API_ENDPOINTS.SEND_NOTIFICATION, {
          email: expectedNormalisedEmail,
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
        .post(PATH_DATA.CHANGE_EMAIL.url)
        .type("form")
        .set("Cookie", cookies)
        .send({
          _csrf: token,
          email: inputEmail,
        })
        .expect(302)
        .expect("Location", PATH_DATA.CHECK_YOUR_EMAIL.url);

      // Assert
      expect(receivedEmail).to.equal(expectedNormalisedEmail);
    };

    it("should normalise email to all lowercase", async () => {
      await performTest("Test@Example.Com", "test@example.com");
    });

    it("should normalise Gmail email to lowercase", async () => {
      await performTest("Test@Gmail.Com", "test@gmail.com");
    });

    it("should not remove full stops from email", async () => {
      await performTest("Test.user@Gmail.Com", "test.user@gmail.com");
    });

    it("should not remove sub-addresses for gmail accounts", async () => {
      await performTest("Test+user@Gmail.Com", "test+user@gmail.com");
    });

    it("should not remove sub-addresses for outlook accounts", async () => {
      await performTest("Test+user@outlook.Com", "test+user@outlook.com");
    });

    it("should not remove sub-addresses for yahoo accounts", async () => {
      await performTest("Test+user@icloud.Com", "test+user@icloud.com");
    });

    it("should convert googlemail.com addresses to gmail.com", async () => {
      await performTest("Test@googlemail.com", "test@gmail.com");
    });
  });
});
