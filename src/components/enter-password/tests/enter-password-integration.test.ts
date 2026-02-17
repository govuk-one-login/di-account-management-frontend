import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from "vitest";
import request from "supertest";
import { testComponent } from "../../../../test/utils/helpers.js";
import * as cheerio from "cheerio";

const nock = require("nock");
import {
  API_ENDPOINTS,
  CLIENT_SESSION_ID_UNKNOWN,
  PATH_DATA,
} from "../../../app.constants.js";
import { UnsecuredJWT } from "jose";
import { checkFailedCSRFValidationBehaviour } from "../../../../test/utils/behaviours.js";
import { getBaseUrl } from "../../../config.js";

describe("Integration::enter password", () => {
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

  beforeAll(async () => {
    vi.resetModules();
    const sessionMiddleware = await import(
      "../../../middleware/requires-auth-middleware.js"
    );
    vi.spyOn(sessionMiddleware, "requiresAuthMiddleware").mockImplementation(
      async function (req: any, _res: any, next: any): Promise<void> {
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
        req.session.mfaMethods = [];
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
      }
    );

    const oidc = await import("../../../utils/oidc.js");
    vi.spyOn(oidc, "getOIDCClient").mockImplementation(() => {
      return Promise.resolve({} as any);
    });

    vi.spyOn(oidc, "getCachedJWKS").mockImplementation(() => {
      return Promise.resolve({} as any);
    });

    app = await (await import("../../../app.js")).createApp();
    baseApi = process.env.AM_API_BASE_URL;

    await setTokenAndCookies();
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    vi.restoreAllMocks();
    app = undefined;
  });

  it("should redirect to security when type not present (GET)", async () => {
    const response = await request(app).get(ENDPOINT).expect(302);
    expect(response.header.location).toBe("/security");
  });

  it("should redirect to security when type not present (POST)", async () => {
    const response = await request(app)
      .post(ENDPOINT)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "password",
      })
      .expect(302);
    expect(response.header.location).toBe("/security");
  });

  it("should return enter password page", async () => {
    const res = await request(app)
      .get(ENDPOINT)
      .query({ type: "changeEmail" })
      .expect(200);
    expect(res.statusCode).toBe(200);
  });

  it("should redirect to your services when csrf not present", async () => {
    await checkFailedCSRFValidationBehaviour(app, ENDPOINT, {
      password: "password",
    });
  });

  // This test checks that all routes that use the state machine
  // are redirected to the Your Services page if the user has not entered their password.
  // I am using the PATH_DATA object so that if we add a new route that uses the state machine,
  // we don't have to add a new test for it.

  const PATHS_TO_EXCLUDE = [
    // exclude the account deletion flow, as the user will be logged out, so the usual tests won't work
    PATH_DATA.ACCOUNT_DELETED_CONFIRMATION,
    PATH_DATA.DELETE_ACCOUNT,
    // Exclude global logout as the state is set mid-journey
    PATH_DATA.GLOBAL_LOGOUT_CONFIRM,
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
            expect(res.status).toBe(302);
            expect(res.headers.location).toContain(PATH_DATA.YOUR_SERVICES.url);
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
              expect(res.headers.location).toContain(
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
        expect($(testComponent("password-error")).text()).toContain(
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
        expect($(testComponent("password-error")).text()).toContain(
          "Enter the correct password"
        );
      })
      .expect(400);
  });

  // Note: The following tests have intentional duplication for clarity.
  // Each test is self-contained to document different authentication scenarios.
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

    expect(res.headers.location).toBeDefined();
    expect(res.headers.location).toContain("/oidc/logout");
    expect(res.headers.location).toContain(
      `post_logout_redirect_uri=${encodeURIComponent(getBaseUrl() + PATH_DATA.LOGOUT_REDIRECT.url)}`
    );
    await setTokenAndCookies();
    expect(res.headers.location).toContain(`state=blocked`);
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

    expect(res.headers.location).toBeDefined();
    expect(res.headers.location).toContain("/oidc/logout");
    expect(res.headers.location).toContain(
      `post_logout_redirect_uri=${encodeURIComponent(getBaseUrl() + PATH_DATA.LOGOUT_REDIRECT.url)}`
    );
    await setTokenAndCookies();
    expect(res.headers.location).toContain(`state=suspended`);
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
        expect($(testComponent("password-error")).text()).toContain(
          "Enter the correct password"
        );
      })
      .expect(400);
  });
});
