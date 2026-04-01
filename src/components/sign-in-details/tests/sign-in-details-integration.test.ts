import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { testComponent } from "../../../../test/utils/helpers";
import * as cheerio from "cheerio";
import * as nock from "nock";
import { PATH_DATA } from "../../../app.constants";
import { getLastNDigits } from "../../../utils/phone-number.js";
import * as config from "../../../config.js";

import { UnsecuredJWT } from "jose";

const { url } = PATH_DATA.SIGN_IN_DETAILS;
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

describe("Integration:: signInDetails", () => {
  beforeEach(() => {
    nock.cleanAll();
    vi.spyOn(config, "passkeysEnabled").mockReturnValue(true);
  });

  it("should not return signInDetails page when feature flag is off", async () => {
    vi.spyOn(config, "passkeysEnabled").mockReturnValue(false);

    const app = await appWithMiddlewareSetup();
    const response = await request(app).get(url);
    expect(response.status).toBe(404);
  });

  it("should return signInDetails page", async () => {
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

  it("should display passkeys", async () => {
    const app = await appWithMiddlewareSetup();
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).toBe(200);
        expect($(testComponent("passkey")).length).toBe(4);
      });
  });
});

const appWithMiddlewareSetup = async (config: any = {}) => {
  const sessionMiddleware = await import(
    "../../../middleware/requires-auth-middleware.js"
  );
  const oidc = await import("../../../utils/oidc.js");
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

  const passkeys = [
    {
      credential: "fake-credential-1",
      id: "f5cf86e0-6eb5-4965-8c5e-2516b8f1c625",
      aaguid: "1ac71f64-468d-4fe0-bef1-0e5f2f551f18",
      isAttested: false,
      signCount: 1,
      transports: ["usb"],
      isBackUpEligible: false,
      isBackedUp: false,
      createdAt: "2026-01-25T19:04:16.341Z",
      lastUsedAt: "2026-02-08T09:33:10.341Z",
    },
    {
      credential: "fake-credential-2",
      id: "2250f2de-2add-4d2d-bb0c-4e67f2a7d4bf",
      aaguid: "00000000-0000-0000-0000-000000000000",
      isAttested: false,
      signCount: 0,
      transports: ["internal"],
      isBackUpEligible: true,
      isBackedUp: true,
      createdAt: "2025-11-05T05:09:01.341Z",
    },
    {
      credential: "fake-credential-3",
      id: "8518d6e1-a126-463f-b682-103b7f8b1852",
      aaguid: "dd4ec289-e01d-41c9-bb89-70fa845d4bf2",
      isAttested: false,
      signCount: 0,
      transports: ["internal"],
      isBackUpEligible: true,
      isBackedUp: true,
      createdAt: "2026-01-19T19:04:16.341Z",
      lastUsedAt: "2026-02-25T20:06:19.341Z",
    },
    {
      credential: "fake-credential-4",
      id: "7b83b06f-f5a7-495b-9f1c-5485c66b19ee",
      aaguid: "ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4",
      isAttested: false,
      signCount: 0,
      transports: ["internal"],
      isBackUpEligible: true,
      isBackedUp: false,
      createdAt: "2025-12-19T12:32:19.341Z",
    },
  ];
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
    getPasskeys: vi.fn().mockResolvedValue({ success: true, data: passkeys }),
  };

  vi.spyOn(mfa, "createMfaClient").mockResolvedValue(stubMfaClient);

  const app = await import("../../../app.js");
  return await app.createApp();
};
