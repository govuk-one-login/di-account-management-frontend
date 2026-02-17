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
import {
  API_ENDPOINTS,
  CLIENT_SESSION_ID_UNKNOWN,
  NOTIFICATION_TYPE,
  PATH_DATA,
} from "../../../app.constants";
import { UnsecuredJWT } from "jose";
import { checkFailedCSRFValidationBehaviour } from "../../../../test/utils/behaviours";
import * as cheerio from "cheerio";

const nock = require("nock");

describe("Integration:: request email code", () => {
  let token: string | string[];
  let cookies: string;
  let app: any;
  let baseApi: string;

  const TEST_SUBJECT_ID = "jkduasd";

  beforeAll(async () => {
    vi.resetModules();
    const sessionMiddleware = await import(
      "../../../middleware/requires-auth-middleware.js"
    );
    vi.spyOn(sessionMiddleware, "requiresAuthMiddleware").mockImplementation(
      function (req: any, res: any, next: any): void {
        req.session.user = {
          email: "test@test.com",
          newEmailAddress: "new@test.com",
          phoneNumber: "07839490040",
          subjectId: TEST_SUBJECT_ID,
          isAuthenticated: true,
          state: {
            changeEmail: {
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
      return Promise.resolve({} as any);
    });

    app = await (await import("../../../app.js")).createApp();
    baseApi = process.env.AM_API_BASE_URL;

    await request(app)
      .get(PATH_DATA.RESEND_EMAIL_CODE.url)
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

  it("should return resend email code page", async () => {
    const res = await request(app)
      .get(PATH_DATA.RESEND_EMAIL_CODE.url)
      .expect(200);
    expect(res.statusCode).toBe(200);
  });

  it("should redirect to your services when csrf not present", async () => {
    await checkFailedCSRFValidationBehaviour(
      app,
      PATH_DATA.RESEND_EMAIL_CODE.url,
      {
        code: "123456",
      }
    );
  });

  it("should resend email when submitted", async () => {
    // Arrange
    let receivedEmail: string;
    nock(baseApi)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .post(API_ENDPOINTS.SEND_NOTIFICATION, {
        email: "new@test.com",
        notificationType: "VERIFY_EMAIL",
      })
      .reply(
        204,
        (
          uri,
          requestBody: {
            email: string;
            notificationType: NOTIFICATION_TYPE.VERIFY_EMAIL;
          }
        ) => {
          receivedEmail = requestBody.email;
          return {};
        }
      );

    // Act
    await request(app)
      .post(PATH_DATA.RESEND_EMAIL_CODE.url)
      .type("form")
      .set("Cookie", cookies)
      .send({ _csrf: token })
      .expect(302);

    // Assert
    expect(receivedEmail).toBe("new@test.com");
  });
});
