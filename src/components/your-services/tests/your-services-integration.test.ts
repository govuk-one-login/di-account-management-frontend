import request from "supertest";
import { describe } from "mocha";
import { testComponent } from "../../../../test/utils/helpers";
import { expect, sinon } from "../../../../test/utils/test-utils";
import * as cheerio from "cheerio";
import * as nock from "nock";
import decache from "decache";
import { PATH_DATA } from "../../../app.constants";

const { url } = PATH_DATA.YOUR_SERVICES;

const DEFAULT_USER_SESSION = {
  email: "test@test.com",
  isAuthenticated: true,
  subjectId: "asdf",
  state: {},
  tokens: {
    accessToken: "token",
    idToken: "Idtoken",
    refreshToken: "token",
  },
};

describe("Integration:: your services", () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  it("should display an empty state when no services have been added", async () => {
    const app = await appWithMiddlewareSetup();
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(testComponent("empty-state")).length).to.not.equal(0);
      });
  });

  it("should display accounts without a section heading when only accounts but not services have been added", async () => {
    const app = await appWithMiddlewareSetup({ hasAccounts: true });
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(`h2${testComponent("accounts-heading")}`).length).to.equal(0);
        expect(
          $(`h2${testComponent("account-card-heading")}`).length
        ).to.not.equal(0);
      });
  });

  it("should display services without a section heading when only services but not accounts have been added", async () => {
    const app = await appWithMiddlewareSetup({ hasServices: true });
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(`h2${testComponent("services-heading")}`).length).to.equal(0);
        expect(
          $(`h2${testComponent("service-card-heading")}`).length
        ).to.not.equal(0);
      });
  });

  it("should display services and accounts with section headings when both services and accounts have been added", async () => {
    const app = await appWithMiddlewareSetup({
      hasAccounts: true,
      hasServices: true,
    });
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect(
          $(`h3${testComponent("account-card-heading")}`).length
        ).to.not.equal(0);
        expect(
          $(`h3${testComponent("service-card-heading")}`).length
        ).to.not.equal(0);
        expect($(`h2${testComponent("services-heading")}`).length).to.not.equal(
          0
        );
        expect($(`h2${testComponent("accounts-heading")}`).length).to.not.equal(
          0
        );
      });
  });
});

const appWithMiddlewareSetup = async (data?: {
  hasAccounts?: boolean;
  hasServices?: boolean;
}) => {
  decache("../../../app");
  decache("../../../middleware/requires-auth-middleware");
  const sandbox = sinon.createSandbox();
  const sessionMiddleware = require("../../../middleware/requires-auth-middleware");
  const yourServices = require("../../../utils/yourServices");
  const oidc = require("../../../utils/oidc");
  const params = data || {};
  const accounts = params.hasAccounts || false;
  const services = params.hasServices || false;

  sandbox.stub(sessionMiddleware, "requiresAuthMiddleware").callsFake(function (
    req: any,
    res: any,
    next: any
  ): void {
    req.session.user = DEFAULT_USER_SESSION;
    next();
  });

  sandbox.stub(yourServices, "presentYourServices").callsFake(function () {
    return {
      accountsList: accounts
        ? [
            {
              client_id: "gov-uk",
              count_successful_logins: "1",
              last_accessed: "",
              last_accessed_readable_format: "",
            },
          ]
        : [],
      servicesList: services
        ? [
            {
              client_id: "dbs",
              count_successful_logins: "1",
              last_accessed: "",
              last_accessed_readable_format: "",
            },
          ]
        : [],
    };
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

  return await require("../../../app").createApp();
};
