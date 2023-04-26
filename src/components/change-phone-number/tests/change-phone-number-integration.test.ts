import request from "supertest";
import { describe } from "mocha";
import { expect, sinon } from "../../../../test/utils/test-utils";
import nock = require("nock");
import * as cheerio from "cheerio";
import decache from "decache";
import {
  API_ENDPOINTS,
  HTTP_STATUS_CODES,
  PATH_DATA,
} from "../../../app.constants";
import { UnsecuredJWT } from "jose";

describe("Integration:: change phone number", () => {
  let sandbox: sinon.SinonSandbox;
  let token: string | string[];
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
      baseApi = "https://oidc.build.account.gov.uk";

    request(app)
      .get(PATH_DATA.CHANGE_PHONE_NUMBER.url)
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

  it("should return change phone number page", (done) => {
    request(app).get(PATH_DATA.CHANGE_PHONE_NUMBER.url).expect(200, done);
  });

  it("should return error when csrf not present", (done) => {
    request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .send({
        phoneNumber: "123456789",
      })
      .expect(500, done);
  });

  it("should return validation error when uk phone number not entered", (done) => {
    request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#phoneNumber-error").text()).to.contains(
          "Enter a UK phone number"
        );
      })
      .expect(400, done);
  });

  it("should return validation error when uk phone number entered is not valid", (done) => {
    request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "123456789",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#phoneNumber-error").text()).to.contains(
          "Enter a UK phone number"
        );
      })
      .expect(400, done);
  });

  it("should return validation error when uk phone number entered contains text", (done) => {
    request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "123456789dd",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#phoneNumber-error").text()).to.contains(
          "Enter a UK mobile phone number using only numbers or the + symbol"
        );
      })
      .expect(400, done);
  });

  it("should return validation error when uk phone number entered less than 12 characters", (done) => {
    request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "123",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#phoneNumber-error").text()).to.contains(
          "Enter a UK phone number, like 07700 900000"
        );
      })
      .expect(400, done);
  });

  it("should return validation error when uk phone number entered greater than 12 characters", (done) => {
    request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "123123123123123123",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#phoneNumber-error").text()).to.contains(
          "Enter a UK phone number, like 07700 900000"
        );
      })
      .expect(400, done);
  });

  it("should return validation error when international phone number not entered", (done) => {
    request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        hasInternationalPhoneNumber: true,
        internationalPhoneNumber: "",
        supportInternationalNumbers: true,
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#internationalPhoneNumber-error").text()).to.contains(
          "Enter a phone number"
        );
        expect($("#phoneNumber-error").text()).to.contains("");
      })
      .expect(400, done);
  });

  it("should return validation error when international phone number entered is not valid", (done) => {
    request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        hasInternationalPhoneNumber: true,
        internationalPhoneNumber: "123456789",
        supportInternationalNumbers: true,
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#internationalPhoneNumber-error").text()).to.contains(
          "Enter a phone number in the correct format"
        );
        expect($("#phoneNumber-error").text()).to.contains("");
      })
      .expect(400, done);
  });

  it("should return validation error when international phone number entered contains text", (done) => {
    request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        hasInternationalPhoneNumber: true,
        internationalPhoneNumber: "123456789dd",
        supportInternationalNumbers: true,
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#internationalPhoneNumber-error").text()).to.contains(
          "Enter a phone number using only numbers or the + symbol"
        );
        expect($("#phoneNumber-error").text()).to.contains("");
      })
      .expect(400, done);
  });

  it("should return validation error when international phone number entered less than 8 characters", (done) => {
    request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        hasInternationalPhoneNumber: true,
        internationalPhoneNumber: "1234567",
        supportInternationalNumbers: true,
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#internationalPhoneNumber-error").text()).to.contains(
          "Enter a phone number in the correct format"
        );
        expect($("#phoneNumber-error").text()).to.contains("");
      })
      .expect(400, done);
  });

  it("should return validation error when international phone number entered greater than 16 characters", (done) => {
    request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        hasInternationalPhoneNumber: true,
        internationalPhoneNumber: "12345678901234567",
        supportInternationalNumbers: true,
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#internationalPhoneNumber-error").text()).to.contains(
          "Enter a phone number in the correct format"
        );
        expect($("#phoneNumber-error").text()).to.contains("");
      })
      .expect(400, done);
  });

  it("should return validation error when new phone number is the same as old phone number", (done) => {
    nock(baseApi)
      .post(API_ENDPOINTS.SEND_NOTIFICATION)
      .once()
      .reply(400, { code: 1044 });

    request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "07738394991",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#phoneNumber-error").text()).to.contains(
          "Your account is already using that phone number. Enter a different phone number."
        );
      })
      .expect(400, done);
  });

  it("should redirect to /check-your-phone page when valid international phone number entered", (done) => {
    nock(baseApi)
      .post(API_ENDPOINTS.SEND_NOTIFICATION)
      .once()
      .reply(HTTP_STATUS_CODES.NO_CONTENT);

    request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        hasInternationalPhoneNumber: true,
        internationalPhoneNumber: "+33645453322",
        supportInternationalNumbers: true,
      })
      .expect("Location", "/check-your-phone")
      .expect(302, done);
  });

  it("should return internal server error if send-otp-notification API call fails", (done) => {
    nock(baseApi).post(API_ENDPOINTS.SEND_NOTIFICATION).once().reply(500, {
      sessionState: "done",
    });

    request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "07738394991",
      })
      .expect(500, done);
  });

  it("should redirect to /check-your-phone page when valid UK phone number entered", (done) => {
    nock(baseApi).post(API_ENDPOINTS.SEND_NOTIFICATION).once().reply(204, {});

    request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "07738394991",
      })
      .expect("Location", "/check-your-phone")
      .expect(302, done);
  });

  it("should redirect to /check-your-phone page when valid UK phone number prefixed with +447 is entered", (done) => {

    nock(baseApi).post(API_ENDPOINTS.SEND_NOTIFICATION).once().reply(204, {});

    request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "+447738394991",
      })
      .expect("Location", "/check-your-phone")
      .expect(302, done);
  });

  it("should redirect to /check-your-phone page when valid UK phone number prefixed with 447 is entered", (done) => {
    nock(baseApi).post(API_ENDPOINTS.SEND_NOTIFICATION).once().reply(204, {});

    request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "447738394991",
      })
      .expect("Location", "/check-your-phone")
      .expect(302, done);
  });

  it("should redirect to /check-your-phone page when valid UK phone number prefixed with 440 is entered", (done) => {
    nock(baseApi).post(API_ENDPOINTS.SEND_NOTIFICATION).once().reply(204, {});

    request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "4407738394991",
      })
      .expect("Location", "/check-your-phone")
      .expect(302, done);
  });

  it("should redirect to /check-your-phone page when valid UK phone number prefixed with +440 is entered", (done) => {
    nock(baseApi).post(API_ENDPOINTS.SEND_NOTIFICATION).once().reply(204, {});

    request(app)
      .post(PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: "+4407738394991",
      })
      .expect("Location", "/check-your-phone")
      .expect(302, done);
  });
});
