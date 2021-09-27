import request from "supertest";
import { describe } from "mocha";
import { expect, sinon } from "../../../../test/utils/test-utils";
import nock = require("nock");
import * as cheerio from "cheerio";
import decache from "decache";
import { PATH_DATA } from "../../../app.constants";
import { JWT } from "jose";

describe("Integration:: change email", () => {
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
            changeEmail: {
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
        expect($("#email-error").text()).to.contains(
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
        expect(page("#email-error").text()).to.contains(
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
        expect(page("#email-error").text()).to.contains(
          "Your account is already using that email address. Enter a different email address."
        );
      })
      .expect(400, done);
  });

  it("should return validation error when same email used by another user", (done) => {
    nock(baseApi).post("/send-otp-notification").once().reply(400, {});
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
        expect(page("#email-error").text()).to.contains(
          "That email address already has a GOV.UK account. Enter a different email address."
        );
      })
      .expect(400, done);
  });

  it("should redirect to /check-your-email when valid email", (done) => {
    nock(baseApi).post("/send-otp-notification").once().reply(204, {});

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
});
