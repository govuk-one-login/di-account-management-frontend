import request from "supertest";
import { describe } from "mocha";
import { expect, sinon } from "../../../../test/utils/test-utils";
import { testComponent } from "../../../../test/utils/helpers";
import nock = require("nock");
import * as cheerio from "cheerio";
import decache from "decache";
import {
  API_ENDPOINTS,
  CLIENT_SESSION_ID_UNKNOWN,
  PATH_DATA,
} from "../../../app.constants";
import { UnsecuredJWT } from "jose";
import { checkFailedCSRFValidationBehaviour } from "../../../../test/utils/behaviours";
import { getBaseUrl } from "../../../config";

describe("Integration::enter password", () => {
  let sandbox: sinon.SinonSandbox;
  let token: string | string[];
  let cookies: string;
  let app: any;
  let baseApi: string;

  const setTokenAndCookies = async () => {
    await request(app)
      .get(ENDPOINT)
      .query({ type: "changeEmail" })
      .then((res) => {
        const $ = cheerio.load(res.text);
        token = $("[name=_csrf]").val();
        cookies = res.headers["set-cookie"];
      });
  };

  const ENDPOINT = PATH_DATA.ENTER_PASSWORD.url;

  before(async () => {
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
            changeEmail: { value: "AUTHENTICATE", events: ["AUTHENTICATED"] },
            changePassword: {
              value: "AUTHENTICATE",
              events: ["AUTHENTICATED"],
            },
            changePhoneNumber: {
              value: "AUTHENTICATE",
              events: ["AUTHENTICATED"],
            },
            deleteAccount: { value: "AUTHENTICATE", events: ["AUTHENTICATED"] },
          },
          tokens: {
            accessToken: new UnsecuredJWT({})
              .setIssuedAt()
              .setSubject("12345")
              .setIssuer("urn:example:issuer")
              .setAudience("urn:example:audience")
              .setExpirationTime("2h")
              .encode(),
            idToken: "Idtoken",
            refreshToken: "token",
          },
        };
        req.oidc = {
          endSessionUrl: (params: any) => {
            let url = "/oidc/logout";
            if (params) {
              const q = Object.entries(params)
                .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
                .join("&");
              url += "?" + q;
            }
            return url;
          },
        };
        next();
      });

    const oidc = require("../../../utils/oidc");
    sandbox.stub(oidc, "getOIDCClient").callsFake(() => {
      return Promise.resolve({});
    });

    sandbox.stub(oidc, "getCachedJWKS").callsFake(() => {
      return Promise.resolve({});
    });

    app = await require("../../../app").createApp();
    baseApi = process.env.AM_API_BASE_URL;

    await setTokenAndCookies();
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  after(() => {
    sandbox.restore();
    app = undefined;
  });

  it("should redirect to settings when type not present (GET)", async () => {
    const response = await request(app).get(ENDPOINT).expect(302);
    expect(response.header["location"]).to.equal("/settings");
  });

  it("should redirect to settings when type not present (POST)", async () => {
    const response = await request(app)
      .post(ENDPOINT)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "password",
      })
      .expect(302);
    expect(response.header["location"]).to.equal("/settings");
  });

  it("should return enter password page", (done) => {
    request(app).get(ENDPOINT).query({ type: "changeEmail" }).expect(200, done);
  });

  it("should redirect to your services when csrf not present", async () => {
    await checkFailedCSRFValidationBehaviour(app, ENDPOINT, {
      password: "password",
    });
  });

  // This test checks that all routes that use the state machine
  // are redirected to the your services page if the user has not entered their password.
  // I am using the PATH_DATA object, so that if we add a new route that uses the state machine,
  // we don't have to add a new test for it.

  const PATHS_TO_EXCLUDE = [
    // exclude the account deletion flow, as the user will be logged out, so the usual tests wont work
    PATH_DATA.ACCOUNT_DELETED_CONFIRMATION,
    PATH_DATA.DELETE_ACCOUNT,
  ];

  Object.entries(PATH_DATA)
    .filter(([, pathData]) => {
      return !!pathData.event; //if there is an event property, it uses the state machine, so we want to test it
    })
    .filter(([, pathData]) => {
      return !PATHS_TO_EXCLUDE.map((path) => path.url).includes(pathData.url);
    })
    .forEach(([requestType, redirectPath]) => {
      it(`should redirect to your services when trying to GET ${requestType} without entering password`, async () => {
        await request(app)
          .get(redirectPath.url)
          .set("Cookie", cookies)
          .then((res) => {
            expect(res.status).to.equal(302);
            expect(res.headers.location).to.contain(
              PATH_DATA.YOUR_SERVICES.url
            );
          });
      });

      it(`should redirect to your services (or 404) when trying to POST ${requestType} without entering password`, async () => {
        await request(app)
          .post(redirectPath.url)
          .set("Cookie", cookies)
          .send({
            _csrf: token,
          })
          .then((res) => {
            if (res.status === 302) {
              expect(res.headers.location).to.contain(
                PATH_DATA.YOUR_SERVICES.url
              );
              return;
            }
            if (res.status !== 404) {
              throw Error(
                "unauthorised post request should redirect or throw 404"
              );
            }
          });
      });
    });

  it("should return validation error when password not entered", async () => {
    await request(app)
      .post(ENDPOINT)
      .type("form")
      .set("Cookie", cookies)
      .query({
        type: "changeEmail",
      })
      .send({
        _csrf: token,
        password: "",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("password-error")).text()).to.contains(
          "Enter your password"
        );
      })
      .expect(400);
  });

  it("should return validation error when password is incorrect", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.AUTHENTICATE)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(401);

    // Act
    await request(app)
      .post(ENDPOINT)
      .query({ type: "changeEmail" })
      .type("form")
      .set("Cookie", cookies)
      .query({
        type: "changeEmail",
      })
      .send({
        _csrf: token,
        password: "pasasd",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("password-error")).text()).to.contains(
          "Enter the correct password"
        );
      })
      .expect(400);
  });

  it("should redirect to change email when authenticated", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.AUTHENTICATE)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(204);

    // Act
    await request(app)
      .post(ENDPOINT)
      .type("form")
      .set("Cookie", cookies)
      .query({
        type: "changeEmail",
      })
      .send({
        _csrf: token,
        password: "Password1",
      })
      .expect("Location", PATH_DATA.CHANGE_EMAIL.url)
      .expect(302);
  });

  it("should redirect to change password when authenticated", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.AUTHENTICATE)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(204);

    // Act
    await request(app)
      .post(ENDPOINT)
      .type("form")
      .set("Cookie", cookies)
      .query({
        type: "changePassword",
      })
      .send({
        _csrf: token,
        password: "Password1",
      })
      .expect("Location", PATH_DATA.CHANGE_PASSWORD.url)
      .expect(302);
  });

  it("should redirect to change phone number when authenticated", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.AUTHENTICATE)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(204);

    // Act
    await request(app)
      .post(ENDPOINT)
      .type("form")
      .set("Cookie", cookies)
      .query({
        type: "changePhoneNumber",
      })
      .send({
        _csrf: token,
        password: "Password1",
      })
      .expect("Location", PATH_DATA.CHANGE_PHONE_NUMBER.url)
      .expect(302);
  });

  it("should redirect to delete account when authenticated", async () => {
    // arrange
    nock(baseApi)
      .post(API_ENDPOINTS.AUTHENTICATE)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(204);

    // Act
    await request(app)
      .post(ENDPOINT)
      .type("form")
      .set("Cookie", cookies)
      .query({
        type: "deleteAccount",
      })
      .send({
        _csrf: token,
        password: "Password1",
      })
      .expect("Location", PATH_DATA.DELETE_ACCOUNT.url)
      .expect(302);
  });

  it("should redirect to unavailable permanent when intervention BLOCKED", async () => {
    nock(baseApi)
      .post(API_ENDPOINTS.AUTHENTICATE)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(403, { code: "1084" });

    const res = await request(app)
      .post(ENDPOINT)
      .type("form")
      .set("Cookie", cookies)
      .query({
        type: "changeEmail",
      })
      .send({
        _csrf: token,
        password: "Password1",
      });

    expect(res.headers.location, "Expected redirect location header").to.not.be
      .undefined;
    expect(res.headers.location).to.contain("/oidc/logout");
    expect(res.headers.location).to.contain(
      `post_logout_redirect_uri=${encodeURIComponent(getBaseUrl() + PATH_DATA.LOGOUT_REDIRECT.url)}`
    );
    await setTokenAndCookies();
    expect(res.headers.location).to.contain(`state=blocked`);
  });

  it("should redirect to unavailable temporary when intervention SUSPENDED", async () => {
    nock(baseApi)
      .post(API_ENDPOINTS.AUTHENTICATE)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(403, { code: "1083" });

    const res = await request(app)
      .post(ENDPOINT)
      .type("form")
      .set("Cookie", cookies)
      .query({
        type: "changeEmail",
      })
      .send({
        _csrf: token,
        password: "Password1",
      });

    expect(res.headers.location, "Expected redirect location header").to.not.be
      .undefined;
    expect(res.headers.location).to.contain("/oidc/logout");
    expect(res.headers.location).to.contain(
      `post_logout_redirect_uri=${encodeURIComponent(getBaseUrl() + PATH_DATA.LOGOUT_REDIRECT.url)}`
    );
    await setTokenAndCookies();
    expect(res.headers.location).to.contain(`state=suspended`);
  });

  it("should show incorrect password error for unknown intervention", async () => {
    nock(baseApi)
      .post(API_ENDPOINTS.AUTHENTICATE)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(403);

    await request(app)
      .post(ENDPOINT)
      .type("form")
      .set("Cookie", cookies)
      .query({
        type: "changeEmail",
      })
      .send({
        _csrf: token,
        password: "Password1",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("password-error")).text()).to.contains(
          "Enter the correct password"
        );
      })
      .expect(400);
  });
});
