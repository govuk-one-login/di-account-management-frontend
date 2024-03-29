import request from "supertest";
import { describe, Done } from "mocha";
import { expect, sinon } from "../../../../test/utils/test-utils";
import { testComponent } from "../../../../test/utils/helpers";
import nock = require("nock");
import * as cheerio from "cheerio";
import decache from "decache";
import {
  API_ENDPOINTS,
  NOTIFICATION_TYPE,
  PATH_DATA,
} from "../../../app.constants";
import { UnsecuredJWT } from "jose";

describe("Integration:: change email", () => {
  let sandbox: sinon.SinonSandbox;
  let token: string | string[];
  let cookies: string;
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
      return new Promise((resolve) => {
        resolve({});
      });
    });

    sandbox.stub(oidc, "getJWKS").callsFake(() => {
      return new Promise((resolve) => {
        resolve({});
      });
    });

    app = await require("../../../app").createApp();
    baseApi = process.env.AM_API_BASE_URL;

    request(app)
      .get(PATH_DATA.CHANGE_EMAIL.url)
      .end((err, res) => {
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

  it("should return error when csrf not present", (done) => {
    request(app)
      .post(PATH_DATA.CHANGE_EMAIL.url)
      .type("form")
      .send({
        email: "123456",
      })
      .expect(500, done);
  });

  it("should return validation error when email not entered", (done) => {
    request(app)
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
      .expect(400, done);
  });

  it("should return validation error when invalid email entered", (done) => {
    request(app)
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
      .expect(400, done);
  });

  it("should return validation error when same email used", (done) => {
    request(app)
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
      .expect(400, done);
  });

  it("should return validation error when same email used by another user", (done) => {
    nock(baseApi).post(API_ENDPOINTS.SEND_NOTIFICATION).once().reply(400, {});
    request(app)
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
      .expect(400, done);
  });

  it("should redirect to /check-your-email when valid email", (done) => {
    nock(baseApi).post(API_ENDPOINTS.SEND_NOTIFICATION).once().reply(204, {});

    request(app)
      .post(PATH_DATA.CHANGE_EMAIL.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        email: "test1@test.com",
      })
      .expect("Location", PATH_DATA.CHECK_YOUR_EMAIL.url)
      .expect(302, done);
  });

  describe("Email Normalization Tests", () => {
    let receivedEmail: string;

    const setupTest = (
      inputEmail: string,
      expectedNormalisedEmail: string,
      done: Done
    ) => {
      nock(baseApi)
        .post(API_ENDPOINTS.SEND_NOTIFICATION)
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

      request(app)
        .post(PATH_DATA.CHANGE_EMAIL.url)
        .type("form")
        .set("Cookie", cookies)
        .send({
          _csrf: token,
          email: inputEmail,
        })
        .expect(302)
        .expect("Location", PATH_DATA.CHECK_YOUR_EMAIL.url)
        .end((err) => {
          if (err) return done(err);
          expect(receivedEmail).to.equal(expectedNormalisedEmail);
          done();
        });
    };

    it("should normalise email to all lowercase", (done) => {
      setupTest("Test@Example.Com", "test@example.com", done);
    });

    it("should normalise Gmail email to lowercase", (done) => {
      setupTest("Test@Gmail.Com", "test@gmail.com", done);
    });

    it("should not remove full stops from email", (done) => {
      setupTest("Test.user@Gmail.Com", "test.user@gmail.com", done);
    });

    it("should not remove sub-addresses for gmail accounts", (done) => {
      setupTest("Test+user@Gmail.Com", "test+user@gmail.com", done);
    });

    it("should not remove sub-addresses for outlook accounts", (done) => {
      setupTest("Test+user@outlook.Com", "test+user@outlook.com", done);
    });

    it("should not remove sub-addresses for yahoo accounts", (done) => {
      setupTest("Test+user@icloud.Com", "test+user@icloud.com", done);
    });

    it("should convert googlemail.com addresses to gmail.com", (done) => {
      setupTest("Test@googlemail.com", "test@gmail.com", done);
    });
  });
});
