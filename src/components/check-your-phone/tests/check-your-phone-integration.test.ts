import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { testComponent } from "../../../../test/utils/helpers";
import * as cheerio from "cheerio";
import { PATH_DATA } from "../../../app.constants";
import { UnsecuredJWT } from "jose";
import { checkFailedCSRFValidationBehaviour } from "../../../../test/utils/behaviours";

describe("Integration:: check your phone", () => {
  let token: string | string[];
  let cookies: string;
  let app: any;

  beforeAll(async () => {
    vi.resetModules();
    const sessionMiddleware = await import(
      "../../../middleware/requires-auth-middleware.js"
    );
    vi.spyOn(sessionMiddleware, "requiresAuthMiddleware").mockImplementation(
      function (req: any, res: any, next: any): void {
        req.session.user = {
          email: "test@test.com",
          publicSubjectId: "publicSubjectId",
          phoneNumber: "07839490040",
          newPhoneNumber: "07839490041",
          isAuthenticated: true,
          state: {
            changePhoneNumber: {
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

        req.session.mfaMethods = [
          {
            mfaIdentifier: 111111,
            methodVerified: true,
            method: {
              phoneNumber: "070",
              mfaMethodType: "SMS",
            },
            priorityIdentifier: "DEFAULT",
          },
        ];
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

    const mfaClient = await import("../../../utils/mfaClient/index.js");

    const stubMfaClient = {
      retrieve: vi.fn().mockResolvedValue({
        success: true,
        data: [
          {
            mfaIdentifier: 111111,
            methodVerified: true,
            method: {
              phoneNumber: "070",
              mfaMethodType: "SMS",
            },
            priorityIdentifier: "DEFAULT",
          },
        ],
      }),
      update: vi.fn().mockResolvedValue({ success: true }),
    };

    vi.spyOn(mfaClient, "createMfaClient").mockResolvedValue(stubMfaClient);

    app = await (await import("../../../app.js")).createApp();

    await request(app)
      .get(PATH_DATA.CHECK_YOUR_PHONE.url)
      .query({
        intent: "changePhoneNumber",
      })
      .then((res) => {
        const $ = cheerio.load(res.text);
        token = $("[name=_csrf]").val();
        cookies = res.headers["set-cookie"];
      });
  });

  afterAll(() => {
    vi.restoreAllMocks();
    app = undefined;
  });

  it("should return check your phone page", async () => {
    const res = await request(app).get(PATH_DATA.CHECK_YOUR_PHONE.url).query({
      intent: "changePhoneNumber",
    });
    expect(res.statusCode).toBe(200);
  });

  it("should redirect to your services when csrf not present", async () => {
    const res = await checkFailedCSRFValidationBehaviour(
      app,
      PATH_DATA.CHECK_YOUR_PHONE.url,
      {
        code: "123456",
      }
    );
    expect(res).toBeUndefined();
  });

  it("should return validation error when code not entered", async () => {
    await request(app)
      .post(PATH_DATA.CHECK_YOUR_PHONE.url)
      .query({})
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "",
        intent: "changePhoneNumber",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("code-error")).text()).toContain(
          "Enter the code"
        );
      })
      .expect(400);
  });

  it("should return validation error when code is less than 6 characters", async () => {
    await request(app)
      .post(PATH_DATA.CHECK_YOUR_PHONE.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "2",
        intent: "changePhoneNumber",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("code-error")).text()).toContain(
          "Enter the code using only 6 digits"
        );
      })
      .expect(400);
  });

  it("should return validation error when code is greater than 6 characters", async () => {
    await request(app)
      .post(PATH_DATA.CHECK_YOUR_PHONE.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "1234567",
        intent: "changePhoneNumber",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("code-error")).text()).toContain(
          "Enter the code using only 6 digits"
        );
      })
      .expect(400);
  });

  it("should return validation error when code entered contains letters", async () => {
    await request(app)
      .post(PATH_DATA.CHECK_YOUR_PHONE.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "12ert-",
        intent: "changePhoneNumber",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("code-error")).text()).toContain(
          "Enter the code using only 6 digits"
        );
      })
      .expect(400);
  });

  it("should redirect to /update confirmation when valid code entered", async () => {
    // Get fresh token and cookies for this test
    let freshToken: string | string[];
    let freshCookies: string;

    await request(app)
      .get(PATH_DATA.CHECK_YOUR_PHONE.url)
      .query({
        intent: "changePhoneNumber",
      })
      .then((res) => {
        const $ = cheerio.load(res.text);
        freshToken = $("[name=_csrf]").val();
        freshCookies = res.headers["set-cookie"];
      });

    const res = await request(app)
      .post(PATH_DATA.CHECK_YOUR_PHONE.url)
      .type("form")
      .set("Cookie", freshCookies)
      .send({
        _csrf: freshToken,
        code: "111111",
        intent: "changePhoneNumber",
      })
      .expect("Location", PATH_DATA.PHONE_NUMBER_UPDATED_CONFIRMATION.url)
      .expect(302);
    expect(res.statusCode).toBe(302);
  });
});
