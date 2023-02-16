import request from "supertest";
import { describe } from "mocha";
import { expect, sinon } from "../utils/test-utils";
import * as cheerio from "cheerio";
import decache from "decache";
import { PATH_DATA } from "../../src/app.constants";
import {PactV3} from "@pact-foundation/pact";
import path from "path";
import {like} from "@pact-foundation/pact/src/v3/matchers";
import {load} from "cheerio";
import {UnsecuredJWT} from "jose";
import {email} from "@pact-foundation/pact/src/dsl/matchers";


const provider = new PactV3({
  consumer: "Account Management Frontend",
  provider: "Account Management API",
  logLevel: 'debug',
  dir: path.resolve(process.cwd(), "pacts"),
  port: 8080,

});

describe("Integration:: change email", () => {
  let sandbox: sinon.SinonSandbox;
  let token: string | string[];
  let cookies: string;
  let app: any;
  const TEST_SUBJECT_ID = "jkduasd";
  let testToken : string;

  before(async () => {
    decache("../../../app");
    decache("../../../middleware/requires-auth-middleware");
    const sessionMiddleware = require("../../src/middleware/requires-auth-middleware");

    testToken =new UnsecuredJWT({})
      .setIssuedAt()
      .setSubject("12345")
      .setIssuer("urn:example:issuer")
      .setAudience("urn:example:audience")
      .setExpirationTime("2h")
      .encode();


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
            accessToken: testToken,
            idToken: "Idtoken",
            refreshToken: "token",
          },
        };
        next();
      });

    const oidc = require("../../src/utils/oidc");
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

    sandbox.stub(oidc, "isTokenExpired").callsFake(() => {
      return false;
    });

    app = await require("../../src/app").createApp();


    const res = await request(app).get(PATH_DATA.CHANGE_EMAIL.url);

    const $ = load(res.text);
    token = $("[name=_csrf]").val();
    cookies = res.headers["set-cookie"];


  });

  after(() => {
    sandbox.restore();
    app = undefined;
  });


  it("should redirect to /check-your-email when valid email provided", async () => {

    // eslint-disable-next-line no-console
    console.log("executing first test");
    await provider.addInteraction({
      states: [{ description: "API server is healthy, email already assigned to another user" }],
      uponReceiving: "send verify email notification",
      withRequest: {
        method: "POST",
        path: "/send-otp-notification",
        headers : {
          Authorization : like("Bearer eyJhbGciOiJub25lIn0.eyJpYXQiOjE2NzQ3Mz"),
          accept : "application/json",
          "Content-Type": "application/json; charset=utf-8",
        },
        body : {
          email : email("myEmail@mail.com"),
          notificationType: "VERIFY_EMAIL"
        },

      },
      willRespondWith: {
        status: 400,
      },
    });

    await provider.executeTest(async () => {

      //with supertest request
      const response = await request(app).post("/change-email")
          .type("form")
          .set("Cookie", cookies)
          .send({
            _csrf: token,
            email: "test1@test.com",
          });

      const page = cheerio.load(response.text);
      expect(page("#email-error").text()).to.contains(
          "That email address already has a GOV.UK account. Enter a different email address."
      );
      expect(response.statusCode).equals(400);
      return;

    });

  });

  it("should return validation error when same email used by another user", async () => {


    await provider.addInteraction({
      states: [{ description: "API server is healthy" }],
      uponReceiving: "send verify email notification with email already in use by other user",
      withRequest: {
        method: "POST",
        path: "/send-otp-notification",
        headers : {
          Authorization : like("Bearer eyJhbGciOiJub25lIn0.eyJpYXQiOjE2NzQ3Mz"),
          accept : "application/json",
          "Content-Type": "application/json; charset=utf-8",
        },
        body : {
          email : email("myEmail@mail.com"),
          notificationType: "VERIFY_EMAIL"
        },

      },
      willRespondWith: {
        status: 204,
      },
    });

    await provider.executeTest(async () => {

      //with supertest request
      const response = await request(app).post("/change-email")
          .type("form")
          .set("Cookie", cookies)
          .send({
            _csrf: token,
            email: "test1@test.com",
          });

      expect(response.headers.location).equals("/check-your-email");
      expect(response.statusCode).equals(302);
      return;

    });

  });


});
