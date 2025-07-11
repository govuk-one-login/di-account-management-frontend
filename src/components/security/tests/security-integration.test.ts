import request from "supertest";
import { describe } from "mocha";
import { sinon, expect } from "../../../../test/utils/test-utils";
import { testComponent } from "../../../../test/utils/helpers";
import * as cheerio from "cheerio";
import * as nock from "nock";
import decache from "decache";
import { PATH_DATA } from "../../../app.constants";
import { getLastNDigits } from "../../../utils/phone-number";
import { MfaMethod } from "../../../utils/mfaClient/types";
import { MfaClient } from "../../../utils/mfaClient";
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
    await request(app).get(url).expect(200);
  });

  it("should display a redacted phone number when one is available", async () => {
    const app = await appWithMiddlewareSetup({ mfaMethodType: "SMS" });
    const phoneNumberLastFourDigits = getLastNDigits(TEST_USER_PHONE_NUMBER, 4);
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(testComponent("mfa-summary-list")).text()).to.contains(
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
        expect(res.status).to.equal(200);
        expect($(testComponent("change-phone-number")).length).to.equal(0);
      });
  });

  it("should display link to activity log when supportActivityLog is true", async () => {
    const app = await appWithMiddlewareSetup({ supportActivityLog: true });
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(testComponent("activity-log-section")).length).to.equal(1);
      });
  });

  it("should not display link to activity log when supportActivityLog is true and hasAllowedActivityLogServices is false", async () => {
    const app = await appWithMiddlewareSetup({
      supportActivityLog: true,
      hasAllowedActivityLogServices: false,
    });
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(testComponent("activity-log-section")).length).to.equal(0);
      });
  });

  it("should not display link to activity log when supportActivityLog is false", async () => {
    const app = await appWithMiddlewareSetup();
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(testComponent("activity-log-section")).length).to.equal(0);
      });
  });

  it("should display link to global logout page when supportGlobalLogout is true", async () => {
    const app = await appWithMiddlewareSetup({ supportGlobalLogout: true });
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(testComponent("global-logout-section")).length).to.equal(1);
      });
  });

  it("should not display link to global logout page when supportGlobalLogout is false", async () => {
    const app = await appWithMiddlewareSetup({ supportGlobalLogout: false });
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(testComponent("global-logout-section")).length).to.equal(0);
      });
  });
});

const appWithMiddlewareSetup = async (config: any = {}) => {
  decache("../../../app");
  decache("../../../middleware/requires-auth-middleware");
  const sessionMiddleware = require("../../../middleware/requires-auth-middleware");
  const sandbox = sinon.createSandbox();
  const oidc = require("../../../utils/oidc");
  const configFuncs = require("../../../config");
  const checkAllowedServicesList = require("../../../middleware/check-allowed-services-list");
  const mfa = require("../../../utils/mfaClient");
  const methods: Record<string, MfaMethod> = {
    SMS: {
      mfaIdentifier: "1",
      priorityIdentifier: "DEFAULT",
      method: {
        mfaMethodType: "SMS",
        phoneNumber: TEST_USER_PHONE_NUMBER,
      },
      methodVerified: true,
    },
    AUTH_APP: {
      mfaIdentifier: "123456",
      priorityIdentifier: "DEFAULT",
      method: {
        mfaMethodType: "AUTH_APP",
        credential: "abc123",
      },
      methodVerified: true,
    },
  };

  sandbox.stub(sessionMiddleware, "requiresAuthMiddleware").callsFake(function (
    req: any,
    res: any,
    next: any
  ): void {
    req.session.user = config.customUserSession
      ? config.customUserSession
      : DEFAULT_USER_SESSION;
    next();
  });

  sandbox.stub(oidc, "getOIDCClient").callsFake(() => {
    return new Promise((resolve) => {
      resolve({});
    });
  });

  sandbox.stub(oidc, "getCachedJWKS").callsFake(() => {
    return new Promise((resolve) => {
      resolve({});
    });
  });

  sandbox.stub(configFuncs, "supportActivityLog").callsFake(() => {
    return config.supportActivityLog;
  });

  sandbox.stub(configFuncs, "supportGlobalLogout").callsFake(() => {
    return config.supportGlobalLogout;
  });

  sandbox
    .stub(checkAllowedServicesList, "hasAllowedActivityLogServices")
    .resolves(config?.hasAllowedActivityLogServices ?? true);

  const stubMfaClient: sinon.SinonStubbedInstance<MfaClient> =
    sandbox.createStubInstance(mfa.MfaClient);

  stubMfaClient.retrieve.resolves({
    success: true,
    status: 200,
    data: [methods[config.mfaMethodType ? config.mfaMethodType : "AUTH_APP"]],
  });

  sandbox.stub(mfa, "createMfaClient").resolves(stubMfaClient);

  return await require("../../../app").createApp();
};
