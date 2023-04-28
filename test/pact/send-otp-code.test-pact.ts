import request from "supertest";
import {describe} from "mocha";
import {expect, sinon} from "../utils/test-utils";
import decache from "decache";
import {PATH_DATA} from "../../src/app.constants";
import {MatchersV3, PactV3} from "@pact-foundation/pact";
import path from "path";
import nock = require("nock");
import {email} from "@pact-foundation/pact/src/dsl/matchers";
import {load} from "cheerio";
import {number, regex, string} from "@pact-foundation/pact/src/v3/matchers";
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
          email: "test@test.com",
          phoneNumber: "07839490040",
          newPhoneNumber : "07839880040",
          subjectId: TEST_SUBJECT_ID,
          isAuthenticated: true,
          state: {
            changePhoneNumber: {
              value: "CHANGE_VALUE",
              events: ["VALUE_UPDATED", "VERIFY_CODE_SENT"],
            },
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

  it("should redirect to /check-your-phone page when valid UK phone number (07) entered", async () => {
    await provider.addInteraction({
      states: [{ description: "User's current phone number is 07742682930" }],
      uponReceiving: "send SMS notification request to change phone number valid UK phone number (07)",
      withRequest: {
        method: "POST",
        path: "/send-otp-notification",
        headers : {
          Authorization : regex("^Bearer [A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$", exampleToken),
          "Content-Type" : "application/json; charset=utf-8",
          accept : "application/json",
        },
        body : {
          email: email("testEmail@mail.com"),
          phoneNumber: like("07742682930"),
          notificationType: "VERIFY_PHONE_NUMBER"
        },
      },
      willRespondWith: {
        status: 204,
      },
    });

    await provider.executeTest(async () => {
      const response = await request(app).post("/change-phone-number")
        .type("form")
        .set("Cookie", cookies)
        .send({
          _csrf: token,
          phoneNumber: "07738394991",
        });

      expect(response.headers.location).equals("/check-your-phone");
      expect(response.statusCode).equals(302);
      return;
    });
  });

  it("should redirect to /check-your-phone page when valid UK phone number (447) entered", async () => {
    await provider.addInteraction({
      states: [{ description: "User's current phone number is 07742682930" }],
      uponReceiving: "send SMS notification request to change phone number to valid UK phone number (447)",
      withRequest: {
        method: "POST",
        path: "/send-otp-notification",
        headers : {
          Authorization : regex("^Bearer [A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$", exampleToken),
          "Content-Type" : "application/json; charset=utf-8",
          accept : "application/json",
        },
        body : {
          email: email("testEmail@mail.com"),
          phoneNumber: like("4477567634"),
          notificationType: "VERIFY_PHONE_NUMBER"
        },
      },
      willRespondWith: {
        status: 204,
      },
    });

    await provider.executeTest(async () => {
      const response = await request(app).post("/change-phone-number")
        .type("form")
        .set("Cookie", cookies)
        .send({
          _csrf: token,
          phoneNumber: "447738394991",
        });

      expect(response.headers.location).equals("/check-your-phone");
      expect(response.statusCode).equals(302);
      return;
    });
  });

  it("should redirect to /check-your-phone page when valid UK phone number (440) entered", async () => {
    await provider.addInteraction({
      states: [{ description: "User's current phone number is 07742682930" }],
      uponReceiving: "send SMS notification request to change phone number to valid UK phone number (440)",
      withRequest: {
        method: "POST",
        path: "/send-otp-notification",
        headers : {
          Authorization : regex("^Bearer [A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$", exampleToken),
          "Content-Type" : "application/json; charset=utf-8",
          accept : "application/json",
        },
        body : {
          email: email("testEmail@mail.com"),
          phoneNumber: like("44077567634"),
          notificationType: "VERIFY_PHONE_NUMBER"
        },
      },
      willRespondWith: {
        status: 204,
      },
    });

    await provider.executeTest(async () => {
      const response = await request(app).post("/change-phone-number")
        .type("form")
        .set("Cookie", cookies)
        .send({
          _csrf: token,
          phoneNumber: "4407738394991",
        });

      expect(response.headers.location).equals("/check-your-phone");
      expect(response.statusCode).equals(302);
      return;
    });
  });

  it("should redirect to /check-your-phone page when valid UK phone number (+447) entered", async () => {
    await provider.addInteraction({
      states: [{ description: "User's current phone number is 07742682930" }],
      uponReceiving: "send SMS notification request to change phone number valid UK phone number (+447)",
      withRequest: {
        method: "POST",
        path: "/send-otp-notification",
        headers : {
          Authorization : regex("^Bearer [A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$", exampleToken),
          "Content-Type" : "application/json; charset=utf-8",
          accept : "application/json",
        },
        body : {
          email: email("testEmail@mail.com"),
          phoneNumber: like("+447738394991"),
          notificationType: "VERIFY_PHONE_NUMBER"
        },
      },
      willRespondWith: {
        status: 204,
      },
    });

    await provider.executeTest(async () => {
      const response = await request(app).post("/change-phone-number")
        .type("form")
        .set("Cookie", cookies)
        .send({
          _csrf: token,
          phoneNumber: "+447738394991",
        });

      expect(response.headers.location).equals("/check-your-phone");
      expect(response.statusCode).equals(302);
      return;
    });
  });

  it("should redirect to /check-your-phone page when valid UK phone number (+440) entered", async () => {
    await provider.addInteraction({
      states: [{ description: "User's current phone number is 07742682930" }],
      uponReceiving: "send SMS notification request to change phone number to valid UK phone number (+440) entered",
      withRequest: {
        method: "POST",
        path: "/send-otp-notification",
        headers : {
          Authorization : regex("^Bearer [A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$", exampleToken),
          "Content-Type" : "application/json; charset=utf-8",
          accept : "application/json",
        },
        body : {
          email: email("testEmail@mail.com"),
          phoneNumber: like("+4407738394991"),
          notificationType: "VERIFY_PHONE_NUMBER"
        },
      },
      willRespondWith: {
        status: 204,
      },
    });

    await provider.executeTest(async () => {
      const response = await request(app).post("/change-phone-number")
        .type("form")
        .set("Cookie", cookies)
        .send({
          _csrf: token,
          phoneNumber: "+4407738394991",
        });

      expect(response.headers.location).equals("/check-your-phone");
      expect(response.statusCode).equals(302);
      return;
    });
  });

  it("should redirect to /check-your-phone page when valid international phone number entered", async () => {
    await provider.addInteraction({
      states: [{ description: "User's current phone number is 07742682930" }],
      uponReceiving: "send SMS notification request to change phone number to valid new phone number",
      withRequest: {
        method: "POST",
        path: "/send-otp-notification",
        headers : {
          Authorization : regex("^Bearer [A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$", exampleToken),
          "Content-Type" : "application/json; charset=utf-8",
          accept : "application/json",
        },
        body : {
          email: email("testEmail@mail.com"),
          notificationType: "VERIFY_PHONE_NUMBER"
        },
      },
      willRespondWith: {
        status: 204,
      },
    });

    await provider.executeTest(async () => {
      const response = await request(app).post("/change-phone-number")
        .type("form")
        .set("Cookie", cookies)
        .send({
          _csrf: token,
          hasInternationalPhoneNumber: true,
          internationalPhoneNumber: "+33645453322",
          supportInternationalNumbers: true,
        })

      //expect(response.headers.location).equals("/check-your-phone");
      expect(response.statusCode).equals(302);
      return;
    });
  });

  it("should return 400 if new phone number is the same as existing one", async () => {

    await provider.addInteraction({
      states: [{ description: "User's current phone number is 07742682930" }],
      uponReceiving: "send SMS notification request to change phone number to same number",
      withRequest: {
        method: "POST",
        path: "/send-otp-notification",
        headers : {
          Authorization : regex("^Bearer [A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$", exampleToken),
          "Content-Type" : "application/json; charset=utf-8",
          accept : "application/json",
        },
        body : {
          email: email("testEmail@mail.com"),
          phoneNumber: like("07742682930"),
          notificationType: "VERIFY_PHONE_NUMBER"
        },

      },
      willRespondWith: {
        status: 400,
        body : {
          code: 1044,
        },
      },
    });

    await provider.executeTest(async () => {

      //with supertest request
      const response = await request(app).post("/change-phone-number")
        .type("form")
        .set("Cookie", cookies)
        .send({
          _csrf: token,
          phoneNumber: "+447738394991",
        });

      expect(response.statusCode).equals(400);
      return;

    });

  });

  it("should return 400 if new phone number is invalid", async () => {

    await provider.addInteraction({
      states: [{ description: "User's current phone number is 07742682930" }],
      uponReceiving: "send SMS notification request with invalid new phone number",
      withRequest: {
        method: "POST",
        path: "/send-otp-notification",
        headers : {
          Authorization : regex("^Bearer [A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$", exampleToken),
          "Content-Type" : "application/json; charset=utf-8",
          accept : "application/json",
        },
        body : {
          email: email("testEmail@mail.com"),
          phoneNumber: like("+0000000000"),
          notificationType: "VERIFY_PHONE_NUMBER"
        },

      },
      willRespondWith: {
        status: 400,
        body: {
          code: number(1234),
          message: string("something")
        }
      },
    });

    await provider.executeTest(async () => {

      //with supertest request
      const response = await request(app).post("/change-phone-number")
        .type("form")
        .set("Cookie", cookies)
        .send({
          _csrf: token,
          phoneNumber: "+447738394991",
        });

      expect(response.statusCode).equals(500);
      return;

    });

  });

  it("should return validation error when same email used by another user", async () => {

    await provider.addInteraction({
      states: [{ description: "New email (myEmail@mail.com) is already assigned to another user" }],
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
      states: [{ description: "New email (myEmail@mail.com) is not assigned to another user" }],
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
          email: "myEmail@mail.com",
        });

      expect(response.headers.location).equals("/check-your-email");
      expect(response.statusCode).equals(302);
      return;

    });

  });

});
