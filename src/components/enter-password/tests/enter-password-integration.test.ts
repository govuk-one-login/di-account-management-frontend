import request from "supertest";
import { describe } from "mocha";
import { expect, sinon } from "../../../../test/utils/test-utils";
import { testComponent } from "../../../../test/utils/helpers";
import nock = require("nock");
import * as cheerio from "cheerio";
import decache from "decache";
import { API_ENDPOINTS, PATH_DATA } from "../../../app.constants";
import { UnsecuredJWT } from "jose";
import { checkFailedCSRFValidationBehaviour } from "../../../../test/utils/behaviours";
import { CLIENT_SESSION_ID, SESSION_ID } from "../../../../test/utils/builders";

describe("Integration::enter password", () => {
  let sandbox: sinon.SinonSandbox;
  let token: string | string[];
  let cookies: string;
  let app: any;
  let baseApi: string;

  const ENDPOINT = PATH_DATA.ENTER_PASSWORD.url;

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
          isAuthenticated: true,
          state: {
            changeEmail: { value: "AUTHENTICATE", events: ["AUTHENTICATED"] },
            changePassword: {
              value: "AUTHENTICATE",
              events: ["AUTHENTICATED"],
            },
            changePhoneNumber: {
              value: "AUTHENTICATE",
              events: ["AUTHENTICATED"],
            },
            deleteAccount: { value: "AUTHENTICATE", events: ["AUTHENTICATED"] },
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

    await request(app)
      .get(ENDPOINT)
      .query({ type: "changeEmail" })
      .then((res) => {
        const $ = cheerio.load(res.text);
        token = $("[name=_csrf]").val();
        cookies = res.headers["set-cookie"].concat(
          `gs=${SESSION_ID}.${CLIENT_SESSION_ID}`
        );
      });
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  after(() => {
    sandbox.restore();
    app = undefined;
  });

  it("should return enter password page", (done) => {
    request(app).get(ENDPOINT).query({ type: "changeEmail" }).expect(200, done);
  });

  it("should redirect to your services when csrf not present", async () => {
    await checkFailedCSRFValidationBehaviour(app, ENDPOINT, {
      password: "password",
    });
  });

  it("should return validation error when password not entered", async () => {
    await request(app)
      .post(ENDPOINT)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "",
        requestType: "changeEmail",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("password-error")).text()).to.contains(
          "Enter your password"
        );
      })
      .expect(400);
  });

  it("should return validation error when password is incorrect", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.AUTHENTICATE)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID)
      .once()
      .reply(401);

    // Act
    await request(app)
      .post(ENDPOINT)
      .query({ type: "changeEmail" })
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "pasasd",
        requestType: "changeEmail",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("password-error")).text()).to.contains(
          "Enter the correct password"
        );
      })
      .expect(400);
  });

  it("should redirect to change email when authenticated", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.AUTHENTICATE)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID)
      .once()
      .reply(204);

    // Act
    await request(app)
      .post(ENDPOINT)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "Password1",
        requestType: "changeEmail",
      })
      .expect("Location", PATH_DATA.CHANGE_EMAIL.url)
      .expect(302);
  });

  it("should redirect to change password when authenticated", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.AUTHENTICATE)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID)
      .once()
      .reply(204);

    // Act
    await request(app)
      .post(ENDPOINT)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "Password1",
        requestType: "changePassword",
      })
      .expect("Location", PATH_DATA.CHANGE_PASSWORD.url)
      .expect(302);
  });

  it("should redirect to change phone number when authenticated", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.AUTHENTICATE)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID)
      .once()
      .reply(204);

    // Act
    await request(app)
      .post(ENDPOINT)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "Password1",
        requestType: "changePhoneNumber",
      })
      .expect("Location", PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .expect(302);
  });

  it("should redirect to delete account when authenticated", async () => {
    // arrange
    nock(baseApi)
      .post(API_ENDPOINTS.AUTHENTICATE)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID)
      .once()
      .reply(204);

    // Act
    await request(app)
      .post(ENDPOINT)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "Password1",
        requestType: "deleteAccount",
      })
      .expect("Location", PATH_DATA.DELETE_ACCOUNT.url)
      .expect(302);
  });
});
