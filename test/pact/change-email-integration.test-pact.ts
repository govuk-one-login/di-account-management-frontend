import request from "supertest";
import { describe } from "mocha";
import { expect, sinon } from "../utils/test-utils";
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

describe("Pact::/update-email", () => {
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

  it("should redirect to /email-updated-confirmation when valid code entered", async () => {
    nock("http://localhost:4444")
      .put(`${API_ENDPOINTS.ALPHA_GOV_ACCOUNT}` + "jkduasd")
      .once()
      .reply(200);

    await provider.addInteraction({
      states: [{ description: "Email code 654321 exists" }],
      uponReceiving: "send email update request with valid opt code",
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
          otp: regex("^[0-9]{1,6}$", "654321")
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
          code: "654321",
        });

      expect(response.headers.location).equals("/email-updated-confirmation");
      expect(response.statusCode).equals(302);
      return;

    });
  });

  it("should fail when invalid code is entered", async () => {
    nock("http://localhost:4444")
      .put(`${API_ENDPOINTS.ALPHA_GOV_ACCOUNT}` + "jkduasd")
      .once()
      .reply(200);

    await provider.addInteraction({
      states: [{ description: "Email code 000000 does not exists" }],
      uponReceiving: "send email update request with invalid otp code",
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
          otp: regex("^[0-9]{1,6}$", "000000")
        },

      },
      willRespondWith: {
        status: 400,
      },
    });

    await provider.executeTest(async () => {

      //with supertest request
      const response = await request(app).post("/check-your-email")
        .type("form")
        .set("Cookie", cookies)
        .send({
          _csrf: token,
          code: "000000",
        });

      expect(response.statusCode).equals(400);
      return;

    });
  });

});
