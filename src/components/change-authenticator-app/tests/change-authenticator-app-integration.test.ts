import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import * as cheerio from "cheerio";
import { PATH_DATA } from "../../../app.constants.js";
import { UnsecuredJWT } from "jose";
import { checkFailedCSRFValidationBehaviour } from "../../../../test/utils/behaviours.js";

describe("Integration:: change authenticator app", () => {
  let token: string | string[];
  let cookies: string;
  let app: Awaited<ReturnType<typeof appWithMiddlewareSetup>>;

  beforeEach(async () => {
    app = await appWithMiddlewareSetup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return change authenticator app page if feature flag is on", async () => {
    await request(app)
      .get(PATH_DATA.CHANGE_AUTHENTICATOR_APP.url)
      .expect((res) => {
        const $ = cheerio.load(res.text);
        token = $("[name=_csrf]").val();
        cookies = res.headers["set-cookie"];
        expect(res.status).toBe(200);
      });
  });

  it("should redirect to your services when csrf not present", async () => {
    await checkFailedCSRFValidationBehaviour(
      app,
      PATH_DATA.CHANGE_AUTHENTICATOR_APP.url,
      {
        code: "123456",
      }
    );
  });

  it("should redirect to /update confirmation when valid code entered", async () => {
    await request(app)
      .get(PATH_DATA.CHANGE_AUTHENTICATOR_APP.url)
      .expect((res) => {
        const $ = cheerio.load(res.text);
        token = $("[name=_csrf]").val();
        cookies = res.headers["set-cookie"];
      });

    await request(app)
      .post(PATH_DATA.CHANGE_AUTHENTICATOR_APP.url)
      .type("form")
      .send({
        _csrf: token,
        code: "111111",
        authAppSecret: "qwer42312345342",
      })
      .set("Cookie", cookies)
      .then((res) => {
        expect(res.headers.location).toBe(
          PATH_DATA.AUTHENTICATOR_APP_UPDATED_CONFIRMATION.url
        );
        expect(res.status).toBe(302);
      });
  });

  const appWithMiddlewareSetup = async () => {
    const sessionMiddleware = await import(
      "../../../middleware/requires-auth-middleware.js"
    );
    const mfaModule = await import("../../../utils/mfa/index.js");
    const oidc = await import("../../../utils/oidc.js");
    const mfa = await import("../../../utils/mfaClient/index.js");

    vi.spyOn(sessionMiddleware, "requiresAuthMiddleware").mockImplementation(
      function (req: any, res: any, next: any): void {
        req.session.user = {
          email: "test@test.com",
          state: {
            changeAuthApp: {
              value: "CHANGE_VALUE",
              events: ["VALUE_UPDATED", "CONFIRMATION"],
            },
          },
          isAuthenticated: true,
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
        req.body = {
          code: "111111",
          authAppSecret: "A".repeat(20),
        };

        req.session.mfaMethods = [
          {
            mfaIdentifier: 111111,
            methodVerified: true,
            phoneNumber: "070",
            method: {
              mfaMethodType: "SMS",
            },
            priorityIdentifier: "DEFAULT",
          },
          {
            mfaIdentifier: 2,
            priorityIdentifier: "BACKUP",
            method: {
              mfaMethodType: "AUTH_APP",
            },
            methodVerified: true,
          },
        ];
        next();
      }
    );

    vi.spyOn(oidc, "getOIDCClient").mockImplementation(() => {
      return Promise.resolve({});
    });

    vi.spyOn(oidc, "getCachedJWKS").mockImplementation(() => {
      return Promise.resolve({});
    });

    vi.spyOn(mfaModule, "generateMfaSecret").mockImplementation(() =>
      "A".repeat(20)
    );
    vi.spyOn(mfaModule, "generateQRCodeValue").mockImplementation(
      () => "qrcode"
    );
    vi.spyOn(mfaModule, "verifyMfaCode").mockImplementation(() => true);

    const stubMfaClient = {
      retrieve: vi.fn().mockResolvedValue({ success: true, data: [] }),
      update: vi.fn().mockResolvedValue({ success: true }),
    };

    vi.spyOn(mfa, "createMfaClient").mockResolvedValue(stubMfaClient);

    const app = await import("../../../app.js");
    return await app.createApp();
  };
});
