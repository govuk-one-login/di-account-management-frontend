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
  HTTP_STATUS_CODES,
  PATH_DATA,
} from "../../../app.constants";
import { UnsecuredJWT } from "jose";
import { checkFailedCSRFValidationBehaviour } from "../../../../test/utils/behaviours";

describe("Integration:: change phone number", () => {
  let sandbox: sinon.SinonSandbox;
  let token: string | string[] | undefined;
  let cookies: string;
  let app: any;
  let baseApi: string;

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
            changePhoneNumber: {
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
    baseApi = process.env.AM_API_BASE_URL || "http://localhost:8080";

    await request(app)
      .get(PATH_DATA.CHANGE_PHONE_NUMBER.url)
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

  it("should return change phone number page", (done) => {
    request(app).get(PATH_DATA.CHANGE_PHONE_NUMBER.url).expect(200, done);
  });

  it("should redirect to your services when csrf not present", async () => {
    await checkFailedCSRFValidationBehaviour(
      app,
      PATH_DATA.CHANGE_PHONE_NUMBER.url,
      {
        phoneNumber: "123456789",
      }
    );
  });

  it("should return validation error when uk phone number not entered", async () => {
    const res = await request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("phoneNumber-error")).text()).to.contains(
          "Enter a UK mobile phone number"
        );
      })
      .expect(400);
    expect(res.statusCode).to.eq(400);
  });

  it("should return validation error when uk phone number entered is not valid", async () => {
    const res = await request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "123456789",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("phoneNumber-error")).text()).to.contains(
          "Enter a UK mobile phone number"
        );
      })
      .expect(400);
    expect(res.statusCode).to.eq(400);
  });

  it("should return validation error when uk phone number entered contains text", async () => {
    const res = await request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "123456789dd",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("phoneNumber-error")).text()).to.contains(
          "Enter a UK mobile phone number using only numbers or the + symbol"
        );
      })
      .expect(400);
    expect(res.statusCode).to.eq(400);
  });

  it("should return validation error when uk phone number entered less than 12 characters", async () => {
    const res = await request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "123",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("phoneNumber-error")).text()).to.contains(
          "Enter a UK mobile phone number, like 07700 900000"
        );
      })
      .expect(400);
    expect(res.statusCode).to.eq(400);
  });

  it("should return validation error when uk phone number entered greater than 12 characters", async () => {
    const res = await request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "123123123123123123",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("phoneNumber-error")).text()).to.contains(
          "Enter a UK mobile phone number, like 07700 900000"
        );
      })
      .expect(400);
    expect(res.statusCode).to.eq(400);
  });

  it("should redirect to /check-your-phone page when valid UK phone number entered", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.SEND_NOTIFICATION)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(204, {});

    // Act
    const res = await request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "07738394991",
      })
      .expect("Location", "/check-your-phone?intent=changePhoneNumber")
      .expect(302);
    expect(res.statusCode).to.eq(302);
  });

  it("should redirect to /check-your-phone page when valid UK phone number prefixed with +447 is entered", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.SEND_NOTIFICATION)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(204, {});

    // Act
    const res = await request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "+447738394991",
      })
      .expect("Location", "/check-your-phone?intent=changePhoneNumber")
      .expect(302);
    expect(res.statusCode).to.eq(302);
  });

  it("should redirect to /check-your-phone page when valid UK phone number prefixed with 447 is entered", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.SEND_NOTIFICATION)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(204, {});

    // Act
    const res = await request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "447738394991",
      })
      .expect("Location", "/check-your-phone?intent=changePhoneNumber")
      .expect(302);
    expect(res.statusCode).to.eq(302);
  });

  it("should redirect to /check-your-phone page when valid UK phone number prefixed with 440 is entered", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.SEND_NOTIFICATION)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(204, {});

    // Act
    const res = await request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "4407738394991",
      })
      .expect("Location", "/check-your-phone?intent=changePhoneNumber")
      .expect(302);
    expect(res.statusCode).to.eq(302);
  });

  it("should redirect to /check-your-phone page when valid UK phone number prefixed with +440 is entered", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.SEND_NOTIFICATION)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(204, {});

    // Act
    const res = await request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "+4407738394991",
      })
      .expect("Location", "/check-your-phone?intent=changePhoneNumber")
      .expect(302);
    expect(res.statusCode).to.eq(302);
  });

  it("should return validation error when new UK phone number is the same as curent phone number", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.SEND_NOTIFICATION)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(400, { code: 1044 });

    // Act
    const res = await request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "07738394991",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("phoneNumber-error")).text()).to.contains(
          "You’re already using that phone number. Enter a different phone number"
        );
      })
      .expect(400);
    expect(res.statusCode).to.eq(400);
  });

  it("should return No UK phone number page", (done) => {
    request(app).get(PATH_DATA.NO_UK_PHONE_NUMBER.url).expect(302, done);
  });

  it("should redirect to /no-uk-phone-number page when international phone number entered", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.SEND_NOTIFICATION)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(HTTP_STATUS_CODES.NO_CONTENT);

    // Act
    const res = await request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "+33645453322",
      })
      .expect("Location", "/no-uk-mobile-phone?type=changePhoneNumber")
      .expect(302);
    expect(res.statusCode).to.eq(302);
  });

  it("should return a bad request if no phone number is provided", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.SEND_NOTIFICATION)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(HTTP_STATUS_CODES.NO_CONTENT);

    // Act
    const res = await request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("phoneNumber-error")).text()).to.contains(
          "Enter a UK mobile phone number"
        );
      })
      .expect(400);
    expect(res.statusCode).to.eq(400);
  });

  it("should return internal server error if send-otp-notification API call fails", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.SEND_NOTIFICATION)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(500, {
        sessionState: "done",
      });

    // Act
    const res = await request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "07738394991",
      })
      .expect(500);
    expect(res.statusCode).to.eq(500);
  });
});
