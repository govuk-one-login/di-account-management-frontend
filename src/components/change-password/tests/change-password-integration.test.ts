import request from "supertest";
import {
  describe,
  beforeAll,
  afterAll,
  it,
  expect,
  vi,
  beforeEach,
} from "vitest";
import { testComponent } from "../../../../test/utils/helpers";
import nock = require("nock");
import { load } from "cheerio";
import {
  API_ENDPOINTS,
  CLIENT_SESSION_ID_UNKNOWN,
  PATH_DATA,
} from "../../../app.constants";
import { UnsecuredJWT } from "jose";
import { checkFailedCSRFValidationBehaviour } from "../../../../test/utils/behaviours";

describe("Integration:: change password", () => {
  let token: string | string[];
  let cookies: string;
  let app: any;
  let baseApi: string;

  beforeAll(async () => {
    vi.resetModules();
    const sessionMiddleware = await import(
      "../../../middleware/requires-auth-middleware.js"
    );
    vi.spyOn(sessionMiddleware, "requiresAuthMiddleware").mockImplementation(
      function (req: any, res: any, next: any): void {
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
        next();
      }
    );

    const oidc = await import("../../../utils/oidc.js");
    vi.spyOn(oidc, "getOIDCClient").mockImplementation(() => {
      return Promise.resolve({});
    });

    vi.spyOn(oidc, "getCachedJWKS").mockImplementation(() => {
      return Promise.resolve({});
    });

    app = await (await import("../../../app.js")).createApp();
    baseApi = process.env.AM_API_BASE_URL;

    await request(app)
      .get(PATH_DATA.CHANGE_PASSWORD.url)
      .then((res) => {
        const $ = load(res.text);
        cookies = res.headers["set-cookie"];
        token = $("[name=_csrf]").val();
      });
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    vi.restoreAllMocks();
    app = undefined;
  });

  it("should return change password page", async () => {
    const res = await request(app)
      .get(PATH_DATA.CHANGE_PASSWORD.url)
      .expect(200);
    expect(res.statusCode).toBe(200);
  });

  it("should redirect to Your services when csrf not present", async () => {
    await checkFailedCSRFValidationBehaviour(
      app,
      PATH_DATA.CHANGE_PASSWORD.url,
      {
        password: "test@test.com",
      }
    );
  });

  it("should return validation error when password not entered", async () => {
    await request(app)
      .post(PATH_DATA.CHANGE_PASSWORD.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "",
        "confirm-password": "",
      })
      .expect(function (res) {
        const $ = load(res.text);
        expect($(testComponent("password-error")).text()).toContain(
          "Enter your new password"
        );
        expect($(testComponent("confirm-password-error")).text()).toContain(
          "Re-type your new password"
        );
      })
      .expect(400);
  });

  it("should return validation error when passwords don't match", async () => {
    await request(app)
      .post(PATH_DATA.CHANGE_PASSWORD.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "sadsadasd33da",
        "confirm-password": "sdnnsad99d",
      })
      .expect(function (res) {
        const $ = load(res.text);
        expect($(testComponent("confirm-password-error")).text()).toContain(
          "Enter the same password in both fields"
        );
      })
      .expect(400);
  });

  it("should return validation error when password less than 8 characters", async () => {
    await request(app)
      .post(PATH_DATA.CHANGE_PASSWORD.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "address",
        "confirm-password": "address",
      })
      .expect(function (res) {
        const $ = load(res.text);
        expect($(testComponent("password-error")).text()).toContain(
          "Your password must be at least 8 characters long and must include letters and numbers"
        );
      })
      .expect(400);
  });

  it("should return validation error when password is all numeric", async () => {
    await request(app)
      .post(PATH_DATA.CHANGE_PASSWORD.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "123456789",
        "confirm-password": "123456789",
      })
      .expect(function (res) {
        const $ = load(res.text);
        expect($(testComponent("password-error")).text()).toContain(
          "Your password must be at least 8 characters long and must include letters and numbers"
        );
      })
      .expect(400);
  });

  it("should return validation error when password is amongst most common passwords", async () => {
    // Arrange
    nock(baseApi)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .post(API_ENDPOINTS.UPDATE_PASSWORD)
      .once()
      .reply(400, { code: 1040 });

    // Act
    await request(app)
      .post(PATH_DATA.CHANGE_PASSWORD.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "password123",
        "confirm-password": "password123",
      })
      .expect(function (res) {
        const $ = load(res.text);
        expect($(testComponent("password-error")).text()).toContain(
          "Enter a stronger password. Do not use very common passwords, such as ‘password’ or a sequence of numbers"
        );
      })
      .expect(400);
  });

  it("should return validation error when password is all letters", async () => {
    nock(baseApi)
      .post(API_ENDPOINTS.UPDATE_PASSWORD)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .reply(204);

    await request(app)
      .post(PATH_DATA.CHANGE_PASSWORD.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "testpassword",
        "confirm-password": "testpassword",
      })
      .expect(function (res) {
        const $ = load(res.text);
        expect($(testComponent("password-error")).text()).toContain(
          "Your password must be at least 8 characters long and must include letters and numbers"
        );
      })
      .expect(400);
  });

  it("should return error when new password is the same as existing password", async () => {
    // Arrange
    nock(baseApi)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .post(API_ENDPOINTS.UPDATE_PASSWORD)
      .once()
      .reply(400, { code: 1024 });

    // Act
    await request(app)
      .post(PATH_DATA.CHANGE_PASSWORD.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "p@ssw0rd-123",
        "confirm-password": "p@ssw0rd-123",
      })
      .expect(function (res) {
        const $ = load(res.text);
        expect($(testComponent("password-error")).text()).toContain(
          "You are already using that password. Enter a different password"
        );
      })
      .expect(400);
  });

  it("should throw error when 400 is returned from API", async () => {
    // Arrange
    nock(baseApi)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .post(API_ENDPOINTS.UPDATE_PASSWORD)
      .once()
      .reply(400, { code: 1000 });

    // Act
    await request(app)
      .post(PATH_DATA.CHANGE_PASSWORD.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "p@ssw0rd-123",
        "confirm-password": "p@ssw0rd-123",
      })
      .expect(function (res) {
        const $ = load(res.text);
        expect($(testComponent("error-heading")).text()).not.toBe("");
      })
      .expect(500);
  });

  it("should redirect to enter phone number when valid password entered", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.UPDATE_PASSWORD)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(204);

    // Act
    const res = await request(app)
      .post(PATH_DATA.CHANGE_PASSWORD.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        password: "action-1",
        "confirm-password": "action-1",
      })
      .expect("Location", PATH_DATA.PASSWORD_UPDATED_CONFIRMATION.url)
      .expect(302);
    expect(res.statusCode).toBe(302);
  });
});
