import request from "supertest";
import { describe } from "mocha";
import { expect, sinon } from "../utils/test-utils";
import * as cheerio from "cheerio";
import decache from "decache";
import {API_ENDPOINTS, PATH_DATA} from "../../src/app.constants";
import {PactV3} from "@pact-foundation/pact";
import path from "path";
import { regex} from "@pact-foundation/pact/src/v3/matchers";
import {load} from "cheerio";
import {UnsecuredJWT} from "jose";
import {email} from "@pact-foundation/pact/src/dsl/matchers";
import nock = require("nock");


const provider = new PactV3({
  consumer: "Account Management Frontend",
  provider: "Account Management API",
  logLevel: "error",
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
  let exampleToken : string;

  before(async () => {
    decache("../../../app");
    decache("../../../middleware/requires-auth-middleware");
    const sessionMiddleware = require("../../src/middleware/requires-auth-middleware");

    exampleToken = "Bearer eyJhbGciOiJub25lIn0.eyJpYXQiOjE2NzY1NDU1MjcsInN1YiI6IjEyMzQ1IiwiaXNzIjoidXJuOmV4YW1wbGU6aXNzdWVyIiwiYXVkIjoidXJuOmV4YW1wbGU6YXVkaWVuY2UiLCJleHAiOjE2NzY1NTI3Mjd9."

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
          newEmailAddress: "myNewEmail@mail.com",
          subjectId: TEST_SUBJECT_ID,
          publicSubjectId: TEST_SUBJECT_ID,
          legacySubjectId: TEST_SUBJECT_ID,
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


  it("should return validation error when same email used by another user", async () => {

    await provider.addInteraction({
      states: [{ description: "API server is healthy, email already assigned to another user" }],
      uponReceiving: "send verify email notification with email already in use by other user",
      withRequest: {
        method: "POST",
        path: "/send-otp-notification",
        headers : {
          Authorization : regex("^Bearer [A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$", exampleToken),
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

  it("should redirect to /check-your-email when valid email provided", async () => {


    await provider.addInteraction({
      states: [{ description: "API server is healthy" }],
      uponReceiving: "send verify email notification",
      withRequest: {
        method: "POST",
        path: "/send-otp-notification",
        headers : {
          Authorization : regex("^Bearer [A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$", exampleToken),
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

  it("should redirect to to /email-updated-confirmation when valid code entered", async () => {
    nock("http://localhost:4444")
      .put(`${API_ENDPOINTS.ALPHA_GOV_ACCOUNT}` + "jkduasd")
      .once()
      .reply(200);

    await provider.addInteraction({
      states: [{ description: "API server is healthy" }],
      uponReceiving: "send valid email update request",
      withRequest: {
        method: "POST",
        path: "/update-email",
        headers : {
          Authorization : regex("^Bearer [A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$", exampleToken),
          accept : "application/json",
          "Content-Type": "application/json; charset=utf-8",
        },
        body : {
          existingEmailAddress : email("myEmail@mail.com"),
          replacementEmailAddress: email("myNewEmail@mail.com"),
          otp: regex("^[0-9]{1,6}$", "123456")
        },

      },
      willRespondWith: {
        status: 204,
      },
    });

    await provider.executeTest(async () => {

      //with supertest request
      const response = await request(app).post("/check-your-email")
        .type("form")
        .set("Cookie", cookies)
        .send({
          _csrf: token,
          code: "123456",
        });

      expect(response.headers.location).equals("/email-updated-confirmation");
      expect(response.statusCode).equals(302);
      return;

    });
  });

});
