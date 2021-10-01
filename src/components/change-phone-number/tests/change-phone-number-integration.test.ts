import request from "supertest";
import { describe } from "mocha";
import { expect, sinon } from "../../../../test/utils/test-utils";
import nock = require("nock");
import * as cheerio from "cheerio";
import decache from "decache";
import { API_ENDPOINTS, PATH_DATA } from "../../../app.constants";
import { JWT } from "jose";

describe("Integration:: change phone number", () => {
  let sandbox: sinon.SinonSandbox;
  let token: string | string[];
  let cookies: string;
  let app: any;
  let baseApi: string;

  before(() => {
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
            accessToken: JWT.sign(
              { sub: "12345", exp: "1758477938" },
              "secret"
            ),
            idToken: "Idtoken",
            refreshToken: "token",
          },
        };
        next();
      });

    app = require("../../../app").createApp();
    baseApi = process.env.AM_API_BASE_URL;

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

  it("should return validation error when phone number not entered", (done) => {
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

  it("should return validation error when phone number entered is not valid", (done) => {
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

  it("should return validation error when phone number entered contains text", (done) => {
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
          "Enter a UK Phone number using numbers only"
        );
      })
      .expect(400, done);
  });

  it("should return validation error when phone number entered less than 12 characters", (done) => {
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

  it("should return validation error when phone number entered greater than 12 characters", (done) => {
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
});
