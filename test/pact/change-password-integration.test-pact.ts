import request from "supertest";
import { describe } from "mocha";
import { expect, sinon } from "../utils/test-utils";
import nock = require("nock");
import { load } from "cheerio";
import decache from "decache";
import { PATH_DATA } from "../../src/app.constants";
import {PactV3} from "@pact-foundation/pact";
import path from "path";
import {email} from "@pact-foundation/pact/src/dsl/matchers";
import {UnsecuredJWT} from "jose";
import {regex} from "@pact-foundation/pact/src/v3/matchers";


const provider = new PactV3({
    consumer: "Account Management Frontend",
    provider: "Account Management API",
    logLevel: "error",
    dir: path.resolve(process.cwd(), "pacts"),
    port: 8080,
});

describe("Integration:: change password", () => {
  let sandbox: sinon.SinonSandbox;
  let token: string | string[];
  let cookies: string;
  let app: any;
  let testToken : string;
  let exampleToken : string;

  before(async () => {
    decache("../../../app");
    decache("../../../middleware/requires-auth-middleware");

    exampleToken = "Bearer eyJhbGciOiJub25lIn0.eyJpYXQiOjE2NzY1NDU1MjcsInN1YiI6IjEyMzQ1IiwiaXNzIjoidXJuOmV4YW1wbGU6aXNzdWVyIiwiYXVkIjoidXJuOmV4YW1wbGU6YXVkaWVuY2UiLCJleHAiOjE2NzY1NTI3Mjd9."

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
          isAuthenticated: true,
          state: {
            changePassword: {
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

    const res = await request(app).get(PATH_DATA.CHANGE_PASSWORD.url);

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


  it("should return validation error when password is amongst most common passwords", async () => {

      await provider.addInteraction({
          states: [{description: "API server is healthy"}],
          uponReceiving: "request to change password",
          withRequest: {
              method: "POST",
              path: "/update-password",
              headers: {
                  // this will need to be request filtered on the provider side
                  Authorization : regex("^Bearer [A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$", exampleToken),
                  accept: "application/json",
                  "Content-Type": "application/json; charset=utf-8",
              },
              body: {
                  email: email("testEmail@mail.com"),
                  newPassword : "password123"
              },

          },
          willRespondWith: {
              status: 400,
              body : {
                  code: 1040
              }
          },
      });

      await provider.executeTest(async () =>{
          const response = await request(app).post("/change-password").type("form")
              .set("Cookie", cookies)
              .send({
                  _csrf: token,
                  password: "password123",
                  "confirm-password": "password123",
              })

          const $ = load(response.text);
          expect($("#password-error").text()).to.contains(
              "Enter a stronger password. Do not use very common passwords, such as ‘password’ or a sequence of numbers"
          );
          expect(response.statusCode).to.equals(400);
          return;

      });
  });

  it("should return error when new password is the same as existing password", async () => {

      await provider.addInteraction({
          states: [{description: "API server is healthy and new password is same as existing password"}],
          uponReceiving: "request to change password",
          withRequest: {
              method: "POST",
              path: "/update-password",
              headers: {
                  // this will need to be request filtered on the provider side
                  Authorization : regex("^Bearer [A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$", exampleToken),
                  accept: "application/json",
                  "Content-Type": "application/json; charset=utf-8",
              },
              body: {
                  email: email("testEmail@mail.com"),
                  newPassword : "p@ssw0rd-123"
              },

          },
          willRespondWith: {
              status: 400,
              body : {
                  code: 1024
              }
          },
      });

      await provider.executeTest(async () =>{
          const response = await request(app).post("/change-password").type("form")
              .set("Cookie", cookies)
              .send({
                  _csrf: token,
                  password: "p@ssw0rd-123",
                  "confirm-password": "p@ssw0rd-123",
              })

          const $ = load(response.text);
          expect($("#password-error").text()).to.contains(
              "Your account is already using that password. Enter a different password"
          );
          expect(response.statusCode).to.equals(400);
          return;

      });

  });
  //
  it("should throw error when 400 is returned from API", async () => {

      await provider.addInteraction({
          states: [{description: "API server is not healthy"}],
          uponReceiving: "request to change password",
          withRequest: {
              method: "POST",
              path: "/update-password",
              headers: {
                  // this will need to be request filtered on the provider side
                  Authorization : regex("^Bearer [A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$", exampleToken),
                  accept: "application/json",
                  "Content-Type": "application/json; charset=utf-8",
              },
              body: {
                  email: email("testEmail@mail.com"),
                  newPassword: "p@ssw0rd-123"
              },

          },
          willRespondWith: {
              status: 400,
              body: {
                  code: 1000
              }
          },
      });

      await provider.executeTest(async () => {
          const response = await request(app).post("/change-password").type("form")
              .set("Cookie", cookies)
              .send({
                  _csrf: token,
                  password: "p@ssw0rd-123",
                  "confirm-password": "p@ssw0rd-123",
              })

          const $ = load(response.text);
          expect($(".govuk-heading-l").text()).to.contains(
              "Sorry, there is a problem with the service"
          );
          expect(response.statusCode).to.equals(500);
      });
  });

  it("should redirect to enter phone number when valid password entered", async () => {
    //nock(baseApi).post(API_ENDPOINTS.UPDATE_PASSWORD).once().reply(204);
      await provider.addInteraction({
          states: [{description: "API server is healthy and valid new password is entered"}],
          uponReceiving: "request to change password",
          withRequest: {
              method: "POST",
              path: "/update-password",
              headers: {
                  // this will need to be request filtered on the provider side
                  Authorization : regex("^Bearer [A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$", exampleToken),
                  accept: "application/json",
                  "Content-Type": "application/json; charset=utf-8",
              },
              body: {
                  email: email("testEmail@mail.com"),
                  newPassword: "p@ssw0rd-123"
              },

          },
          willRespondWith: {
              status: 204,
          },
      });

      await provider.executeTest(async () => {
          const response = await request(app).post("/change-password").type("form")
              .set("Cookie", cookies)
              .send({
                  _csrf: token,
                  password: "p@ssw0rd-123",
                  "confirm-password": "p@ssw0rd-123",
              })

          expect(response.headers.location).equals("/password-updated-confirmation");
          expect(response.statusCode).to.equals(302);
      });
  });
});


