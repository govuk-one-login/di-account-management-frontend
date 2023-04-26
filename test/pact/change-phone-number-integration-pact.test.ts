import request from "supertest";
import {describe} from "mocha";
import {expect, sinon} from "../utils/test-utils";
import decache from "decache";
import {API_ENDPOINTS, PATH_DATA} from "../../src/app.constants";
import {MatchersV3, PactV3} from "@pact-foundation/pact";
import path from "path";
import nock = require("nock");
import {email} from "@pact-foundation/pact/src/dsl/matchers";
import {load} from "cheerio";
import {regex} from "@pact-foundation/pact/src/v3/matchers";
import {UnsecuredJWT} from "jose";
import cheerio from "cheerio";

const { like } = MatchersV3;


const provider = new PactV3({
    consumer: "Account Management Frontend",
    provider: "Account Management API",
    logLevel: "error",
    dir: path.resolve(process.cwd(), "pacts"),
    port: 8080,

});

describe("Integration:: change phone number", () => {
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
    decache("../../../middleware/refresh-token-middleware");

    exampleToken = "Bearer eyJhbGciOiJub25lIn0.eyJpYXQiOjE2NzY1NDU1MjcsInN1YiI6IjEyMzQ1IiwiaXNzIjoidXJuOmV4YW1wbGU6aXNzdWVyIiwiYXVkIjoidXJuOmV4YW1wbGU6YXVkaWVuY2UiLCJleHAiOjE2NzY1NTI3Mjd9.";
    testToken =new UnsecuredJWT({})
      .setIssuedAt()
      .setSubject("12345")
      .setIssuer("urn:example:issuer")
      .setAudience("urn:example:audience")
      .setExpirationTime("2h")
      .encode();

    const sessionMiddleware = require("../../src/middleware/requires-auth-middleware");
    sandbox = sinon.createSandbox();
    sandbox
      .stub(sessionMiddleware, "requiresAuthMiddleware")
      .callsFake(function (req: any, res: any, next: any): void {
        req.session.user = {
            email: "testEmail@mail.com",
            phoneNumber: "07839490040",
            newPhoneNumber : "07839880040",
            subjectId: TEST_SUBJECT_ID,
            isAuthenticated: true,
            state: {
                changePhoneNumber: {
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

        const res = await request(app).get(PATH_DATA.CHANGE_PHONE_NUMBER.url);

        const $ = load(res.text);
        token = $("[name=_csrf]").val();
        cookies = res.headers["set-cookie"];

  });

  beforeEach(() => {
    nock.cleanAll();
  });

  after(() => {
    sandbox.restore();
    app = undefined;
  });

    it("should redirect to to /phone-number-updated-confirmation when valid code entered", async () => {
    nock("http://localhost:4444")
      .put(`${API_ENDPOINTS.ALPHA_GOV_ACCOUNT}${TEST_SUBJECT_ID}`)
      .once()
      .reply(200);

    await provider.addInteraction({
      states: [{ description: "API server is healthy and OTP code exists" }],
      uponReceiving: "valid phone number update request",
      withRequest: {
        method: "POST",
        path: "/update-phone-number",
        headers : {
          Authorization : regex("^Bearer [A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$", exampleToken),
          accept : "application/json",
          "Content-Type": "application/json; charset=utf-8",
        },
        body : {
          email : email("testEmail@mail.com"),
          phoneNumber: like("077567634"),
          otp: regex("^[0-9]{1,6}$", "123456")
        },

      },
      willRespondWith: {
        status: 204,
      },
    });

    await provider.executeTest(async () => {

      //with supertest request
      const response = await request(app).post("/check-your-phone")
        .type("form")
        .set("Cookie", cookies)
        .send({
          _csrf: token,
          code: "123456",
        });

      expect(response.headers.location).equals("/phone-number-updated-confirmation");
      expect(response.statusCode).equals(302);
      return;

    });
  });

    it("should return validation error when incorrect code entered", async () => {
    nock("http://localhost:4444")
      .put(`${API_ENDPOINTS.ALPHA_GOV_ACCOUNT}${TEST_SUBJECT_ID}`)
      .once()
      .reply(200);

    await provider.addInteraction({
      states: [{ description: "API server is healthy and OTP code does not exists" }],
      uponReceiving: "valid phone number update request",
      withRequest: {
        method: "POST",
        path: "/update-phone-number",
        headers : {
          Authorization : regex("^Bearer [A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$", exampleToken),
          accept : "application/json",
          "Content-Type": "application/json; charset=utf-8",
        },
        body : {
          email : email("testEmail@mail.com"),
          phoneNumber: like("077567634"),
          otp: regex("^[0-9]{1,6}$", "000000")
        },

      },
      willRespondWith: {
        status: 400
      },
    });

    await provider.executeTest(async () => {

      //with supertest request
      const response = await request(app).post("/check-your-phone")
        .type("form")
        .set("Cookie", cookies)
        .send({
          _csrf: token,
          code: "000000",
        });

      const $ = cheerio.load(response.text);
      expect($("#code-error").text()).to.contains(
        "The security code you entered is not correct, or may have expired, try entering it again or request a new security code."
      );
      expect(response.statusCode).equals(400);
      return;

    });
  });

});
