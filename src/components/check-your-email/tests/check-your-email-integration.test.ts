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
import nock = require("nock");
import * as cheerio from "cheerio";
import {
  API_ENDPOINTS,
  CLIENT_SESSION_ID_UNKNOWN,
  PATH_DATA,
} from "../../../app.constants.js";
import { UnsecuredJWT } from "jose";
import { checkFailedCSRFValidationBehaviour } from "../../../../test/utils/behaviours.js";

describe("Integration:: check your email", () => {
  let token: string | string[];
  let cookies: string;
  let app: any;
  let baseApi: string;
  let govUkPublishingBaseApi: string;
  const TEST_SUBJECT_ID = "jkduasd";

  beforeAll(async () => {
    vi.resetModules();
    const sessionMiddleware = await import(
      "../../../middleware/requires-auth-middleware.js"
    );
    vi.spyOn(sessionMiddleware, "requiresAuthMiddleware").mockImplementation(
      async function (req: any, res: any, next: any): Promise<void> {
        req.session.user = {
          email: "test@test.com",
          phoneNumber: "07839490040",
          isAuthenticated: true,
          subjectId: TEST_SUBJECT_ID,
          state: {
            changeEmail: {
              value: "VERIFY_CODE",
              events: ["VALUE_UPDATED", "CONFIRMATION"],
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
      return Promise.resolve({} as any);
    });

    vi.spyOn(oidc, "getCachedJWKS").mockImplementation(() => {
      return Promise.resolve({} as any);
    });

    app = await (await import("../../../app.js")).createApp();
    baseApi = process.env.AM_API_BASE_URL;
    govUkPublishingBaseApi = process.env.GOV_ACCOUNTS_PUBLISHING_API_URL;

    await request(app)
      .get(PATH_DATA.CHECK_YOUR_EMAIL.url)
      .then((res) => {
        const $ = cheerio.load(res.text);
        token = $("[name=_csrf]").val();
        cookies = res.headers["set-cookie"];
      });
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    vi.restoreAllMocks();
    app = undefined;
  });

  it("should return check your email page", async () => {
    const res = await request(app)
      .get(PATH_DATA.CHECK_YOUR_EMAIL.url)
      .expect(200);
    expect(res.statusCode).toBe(200);
  });

  it("should redirect to your services when csrf not present", async () => {
    await checkFailedCSRFValidationBehaviour(
      app,
      PATH_DATA.CHECK_YOUR_EMAIL.url,
      {
        code: "123456",
      }
    );
  });

  it("should return validation error when code not entered", async () => {
    await request(app)
      .post(PATH_DATA.CHECK_YOUR_EMAIL.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#code-error").text()).toContain("Enter the code");
      })
      .expect(400);
  });

  it("should return validation error when code is less than 6 characters", async () => {
    await request(app)
      .post(PATH_DATA.CHECK_YOUR_EMAIL.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "2",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#code-error").text()).toContain(
          "Enter the code using only 6 digits"
        );
      })
      .expect(400);
  });

  it("should return validation error when code is greater than 6 characters", async () => {
    await request(app)
      .post(PATH_DATA.CHECK_YOUR_EMAIL.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "1234567",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#code-error").text()).toContain(
          "Enter the code using only 6 digits"
        );
      })
      .expect(400);
  });

  it("should return validation error when code entered contains letters", async () => {
    await request(app)
      .post(PATH_DATA.CHECK_YOUR_EMAIL.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "12ert-",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#code-error").text()).toContain(
          "Enter the code using only 6 digits"
        );
      })
      .expect(400);
  });

  it("should redirect to /email-updated-confirmation when valid code entered", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.UPDATE_EMAIL)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(204);
    nock(govUkPublishingBaseApi)
      .put(`${API_ENDPOINTS.ALPHA_GOV_ACCOUNT}${TEST_SUBJECT_ID}`)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(200);

    // Act
    const res = await request(app)
      .post(PATH_DATA.CHECK_YOUR_EMAIL.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "123456",
      })
      .expect("Location", PATH_DATA.EMAIL_UPDATED_CONFIRMATION.url)
      .expect(302);
    expect(res.statusCode).toBe(302);
  });

  it("should return validation error when incorrect code entered", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.UPDATE_EMAIL)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .once()
      .reply(400, {});

    // Act
    await request(app)
      .post(PATH_DATA.CHECK_YOUR_EMAIL.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "123455",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#code-error").text()).toContain(
          "The code you entered is not correct, or may have expired, try entering it again or request a new code."
        );
      })
      .expect(400);
  });
});
