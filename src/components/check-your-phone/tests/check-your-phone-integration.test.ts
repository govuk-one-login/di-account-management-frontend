import request from "supertest";
import { describe } from "mocha";
import { expect, sinon } from "../../../../test/utils/test-utils";
import nock = require("nock");
import * as cheerio from "cheerio";
import decache from "decache";
import { PATH_DATA } from "../../../app.constants";
import { JWT } from "jose";

describe("Integration:: check your phone", () => {
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
              value: "VERIFY_CODE",
              events: ["VALUE_UPDATED", "CONFIRMATION"],
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
      .get(PATH_DATA.CHECK_YOUR_PHONE.url)
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

  it("should return check your phone page", (done) => {
    request(app).get(PATH_DATA.CHECK_YOUR_PHONE.url).expect(200, done);
  });

  it("should return error when csrf not present", (done) => {
    request(app)
      .post(PATH_DATA.CHECK_YOUR_PHONE.url)
      .type("form")
      .send({
        code: "123456",
      })
      .expect(500, done);
  });

  it("should return validation error when code not entered", (done) => {
    request(app)
      .post(PATH_DATA.CHECK_YOUR_PHONE.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#code-error").text()).to.contains("Enter the security code");
      })
      .expect(400, done);
  });

  it("should return validation error when code is less than 6 characters", (done) => {
    request(app)
      .post(PATH_DATA.CHECK_YOUR_PHONE.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "2",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#code-error").text()).to.contains(
          "Enter the security code using only 6 digits"
        );
      })
      .expect(400, done);
  });

  it("should return validation error when code is greater than 6 characters", (done) => {
    request(app)
      .post(PATH_DATA.CHECK_YOUR_PHONE.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "1234567",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#code-error").text()).to.contains(
          "Enter the security code using only 6 digits"
        );
      })
      .expect(400, done);
  });

  it("should return validation error when code entered contains letters", (done) => {
    request(app)
      .post(PATH_DATA.CHECK_YOUR_PHONE.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "12ert-",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#code-error").text()).to.contains(
          "Enter the security code using only 6 digits"
        );
      })
      .expect(400, done);
  });

  it("should redirect to /create-password when valid code entered", (done) => {
    nock(baseApi).post("/update-phone-number").once().reply(200, {});

    request(app)
      .post(PATH_DATA.CHECK_YOUR_PHONE.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "123456",
      })
      .expect("Location", PATH_DATA.PHONE_NUMBER_UPDATED_CONFIRMATION.url)
      .expect(302, done);
  });

  it("should return validation error when incorrect code entered", (done) => {
    nock(baseApi).post("/update-phone-number").once().reply(400, {});

    request(app)
      .post(PATH_DATA.CHECK_YOUR_PHONE.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "123455",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#code-error").text()).to.contains(
          "The security code you entered is not correct, or may have expired, try entering it again or request a new security code."
        );
      })
      .expect(400, done);
  });
});
