import request from "supertest";
import { describe } from "mocha";
import { sinon, expect } from "../../../../test/utils/test-utils";
import * as cheerio from "cheerio";
import * as nock from "nock";
import decache from "decache";

const TEST_USER_EMAIL = "test@test.com";
const TEST_USER_PHONE_NUMBER = "07839490040";
const DEFAULT_USER_SESSION = {
  email: TEST_USER_EMAIL,
  phoneNumber: TEST_USER_PHONE_NUMBER,
  isAuthenticated: true,
  state: {},
  tokens: {
    accessToken: "token",
    idToken: "Idtoken",
    refreshToken: "token",
  },
};

describe("Integration:: manage your account", () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  it("should return manage your account page", async () => {
    const app = await appWithMiddlewareSetup();
    await request(app).get("/manage-your-account").expect(200);
  });

  it("should display a redacted phone number when one is available", async () => {
    const app = await appWithMiddlewareSetup();
    await request(app)
      .get("/manage-your-account")
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(".govuk-summary-list").text()).to.contains(
          TEST_USER_PHONE_NUMBER.slice(-4)
        );
      });
  });

  it("should not attempt to display phone number when none is known", async () => {
    const { phoneNumber, ...nonPhoneSessionProperties } = DEFAULT_USER_SESSION; // eslint-disable-line @typescript-eslint/no-unused-vars

    const app = await appWithMiddlewareSetup({
      customUserSession: nonPhoneSessionProperties,
    });

    await request(app)
      .get("/manage-your-account")
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(".govuk-summary-list").text()).to.not.contains("phoneNumber");
      });
  });
});

const appWithMiddlewareSetup = async (config: any = {}) => {
  decache("../../../app");
  decache("../../../middleware/requires-auth-middleware");
  const sessionMiddleware = require("../../../middleware/requires-auth-middleware");
  const sandbox = sinon.createSandbox();

  sandbox
    .stub(sessionMiddleware, "requiresAuthMiddleware")
    .callsFake(function (req: any, res: any, next: any): void {
      req.session.user = config.customUserSession
        ? config.customUserSession
        : DEFAULT_USER_SESSION;
      next();
    });

  const oidc = require("../../../utils/oidc");
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

  return await require("../../../app").createApp();
};
