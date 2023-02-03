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

const { like } = MatchersV3;


const provider = new PactV3({
    consumer: "Account Management Frontend",
    provider: "Account Management API",
    logLevel: 'debug',
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

  before(async () => {
    decache("../../../app");
    decache("../../../middleware/requires-auth-middleware");
    decache("../../../middleware/refresh-token-middleware");
    testToken = "eyJhbGciOiJub25lIn0.eyJpYXQiOjE2NzQ3MzM3NDcsInN1YiI6IjEyMzQ1IiwiaXNzIjoidXJuOmV4YW1wbGU6aXNzdWVyIiwiYXVkIjoidXJuOmV4YW1wbGU6YXVkaWVuY2UiLCJleHAiOjE2NzQ3NDA5NDd9.";
    const sessionMiddleware = require("../../src/middleware/requires-auth-middleware");
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

      // console.log("printing res");
      // console.log(res);

      const $ = load(res.text);
      console.log("printing $");
      console.log($);

      token = $("[name=_csrf]").val();
      cookies = res.headers["set-cookie"];


      // eslint-disable-next-line no-console
      console.log("printing cookies")
      // eslint-disable-next-line no-console
      console.log(cookies);

      // eslint-disable-next-line no-console
      console.log("printing csrf")
      // eslint-disable-next-line no-console
      console.log(token);
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  after(() => {
    sandbox.restore();
    app = undefined;
  });


  // HERE this is where it hits the Account Management API
    it("should redirect to /check-your-phone page when valid phone number entered", async () => {
        // eslint-disable-next-line no-console
        console.log("executing first test");
      await provider.addInteraction({
          states: [{ description: "API server is healthy" }],
          uponReceiving: "send notification request uk phone number",
          withRequest: {
              method: "POST",
              path: "/send-otp-notification",
              headers : {
                  Authorization : "Bearer ".concat(testToken),
                  "Content-Type" : "application/json; charset=utf-8",
                  accept : "application/json",
              },
              body : {
                  email: email("testEmail@mail.com"),
                  phoneNumber: like("077567634"),
                  notificationType: "VERIFY_PHONE_NUMBER"
              },

          },
          willRespondWith: {
              status: 204,
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

          expect(response.headers.location).equals("/check-your-phone");
          expect(response.statusCode).equals(302);
          return;


      });


  });

    // other test considered here was to use an international phone number, but that is not relevant to the interaction with this endpoint

    // this is different interaction, where the server is not healthy
    it("should return internal server error if send-otp-notification API call fails", async () => {
        // nock(baseApi).post(API_ENDPOINTS.SEND_NOTIFICATION).once().reply(500, {
        //     sessionState: "done",
        // });
        await provider.addInteraction({
            states: [{ description: "API server is not healthy" }],
            uponReceiving: "send notification request uk phone number",
            withRequest: {
                method: "POST",
                path: "/send-otp-notification",
                headers : {
                    Authorization : "Bearer ".concat(testToken),
                    "Content-Type" : "application/json; charset=utf-8",
                    accept : "application/json",
                },
                body : {
                    email: email("testEmail@mail.com"),
                    phoneNumber: like("something"),
                    notificationType: "VERIFY_PHONE_NUMBER"
                },

            },
            willRespondWith: {
                status: 500,
                body : {
                    sessionState: "done",
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

            expect(response.statusCode).equals(500);
            return;

        });

    });



});
