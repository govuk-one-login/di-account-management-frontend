import request from "supertest";
import { describe } from "mocha";
import { sinon, expect } from "../../../../test/utils/test-utils";
import { testComponent } from "../../../../test/utils/helpers";
import * as cheerio from "cheerio";
import * as nock from "nock";
import decache from "decache";
import { PATH_DATA } from "../../../app.constants";
import { getLastNDigits } from "../../../utils/phone-number";

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
    accessToken: "token",
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
    const app = await appWithMiddlewareSetup();
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  it("should not display link to activity log when supportActivityLog is true and hasAllowedRSAServices is false", async () => {
    const app = await appWithMiddlewareSetup({
      supportActivityLog: true,
      hasAllowedRSAServices: false,
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
});

const appWithMiddlewareSetup = async (config: any = {}) => {
  decache("../../../app");
  decache("../../../middleware/requires-auth-middleware");
  const sessionMiddleware = require("../../../middleware/requires-auth-middleware");
  const sandbox = sinon.createSandbox();
  const oidc = require("../../../utils/oidc");
  const configFuncs = require("../../../config");
  const checkAllowedServicesList = require("../../../middleware/check-allowed-services-list");
  const mfa = require("../../../utils/mfa");

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

  sandbox.stub(oidc, "getJWKS").callsFake(() => {
    return new Promise((resolve) => {
      resolve({});
    });
  });

  sandbox.stub(configFuncs, "supportActivityLog").callsFake(() => {
    return config.supportActivityLog;
  });

  sandbox
    .stub(checkAllowedServicesList, "hasAllowedRSAServices")
    .resolves(config?.hasAllowedRSAServices ?? true);

  sandbox.stub(mfa, "default").resolves([
    {
      mfaIdentifier: 123456,
      priorityIdentifier: "PRIMARY",
      mfaMethodType: "AUTH_APP",
      endPoint: "http://mock-endpoint",
      methodVerified: true,
    },
  ]);

  return await require("../../../app").createApp();
};
