import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { testComponent } from "../../../../test/utils/helpers";
import * as cheerio from "cheerio";
import * as nock from "nock";
import { PATH_DATA } from "../../../app.constants";
import { getLastNDigits } from "../../../utils/phone-number.js";

import { UnsecuredJWT } from "jose";

const { url } = PATH_DATA.SECURITY;
const TEST_USER_EMAIL = "test@test.com";
const TEST_USER_PHONE_NUMBER = "07839490040";
const DEFAULT_USER_SESSION = {
  email: TEST_USER_EMAIL,
  phoneNumber: TEST_USER_PHONE_NUMBER,
  isPhoneNumberVerified: true,
  isAuthenticated: true,
  state: {},
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

describe("Integration:: security", () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  it("should return security page", async () => {
    const app = await appWithMiddlewareSetup();
    const response = await request(app).get(url);
    expect(response.status).toBe(200);
  });

  it("should display a redacted phone number when one is available", async () => {
    const app = await appWithMiddlewareSetup({ mfaMethodType: "SMS" });
    const phoneNumberLastFourDigits = getLastNDigits(TEST_USER_PHONE_NUMBER, 4);
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).toBe(200);
        expect($(testComponent("mfa-summary-list")).text()).toContain(
          phoneNumberLastFourDigits
        );
      });
  });

  it("should not attempt to display phone number when none is known", async () => {
    const { isPhoneNumberVerified, ...nonIsPhoneVerifiedSessionProperties } =
      DEFAULT_USER_SESSION;

    const app = await appWithMiddlewareSetup({
      customUserSession: {
        ...nonIsPhoneVerifiedSessionProperties,
        isPhoneNumberVerified: false,
      },
    });

    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).toBe(200);
        expect($(testComponent("change-phone-number")).length).toBe(0);
      });
  });

  it("should display link to activity log", async () => {
    const app = await appWithMiddlewareSetup();
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).toBe(200);
        expect($(testComponent("activity-log-section")).length).toBe(1);
      });
  });

  it("should display link to global logout page when supportGlobalLogout is true", async () => {
    const app = await appWithMiddlewareSetup({ supportGlobalLogout: true });
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).toBe(200);
        expect($(testComponent("global-logout-section")).length).toBe(1);
      });
  });

  it("should not display link to global logout page when supportGlobalLogout is false", async () => {
    const app = await appWithMiddlewareSetup({ supportGlobalLogout: false });
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).toBe(200);
        expect($(testComponent("global-logout-section")).length).toBe(0);
      });
  });
});

const appWithMiddlewareSetup = async (config: any = {}) => {
  const sessionMiddleware = await import(
    "../../../middleware/requires-auth-middleware.js"
  );
  const oidc = await import("../../../utils/oidc.js");
  const configFuncs = await import("../../../config.js");
  const mfa = await import("../../../utils/mfaClient/index.js");

  vi.spyOn(sessionMiddleware, "requiresAuthMiddleware").mockImplementation(
    function (req: any, res: any, next: any): void {
      req.session.user = config.customUserSession ?? DEFAULT_USER_SESSION;
      next();
    }
  );

  vi.spyOn(oidc, "getOIDCClient").mockImplementation(() => {
    return Promise.resolve({});
  });

  vi.spyOn(oidc, "getCachedJWKS").mockImplementation(() => {
    return Promise.resolve({});
  });

  vi.spyOn(configFuncs, "supportGlobalLogout").mockImplementation(() => {
    return config.supportGlobalLogout;
  });

  const mfaMethods =
    config.mfaMethodType === "SMS"
      ? [
          {
            mfaIdentifier: "1",
            priorityIdentifier: "DEFAULT",
            method: {
              mfaMethodType: "SMS",
              phoneNumber: TEST_USER_PHONE_NUMBER,
            },
            methodVerified: true,
          },
        ]
      : [];

  const stubMfaClient = {
    retrieve: vi.fn().mockResolvedValue({ success: true, data: mfaMethods }),
  };

  vi.spyOn(mfa, "createMfaClient").mockResolvedValue(stubMfaClient);

  const app = await import("../../../app.js");
  return await app.createApp();
};
