import request from "supertest";
import { describe } from "mocha";
import { testComponent } from "../../../../test/utils/helpers";
import { expect, sinon } from "../../../../test/utils/test-utils";
import * as cheerio from "cheerio";
import * as nock from "nock";
import decache from "decache";
import { PATH_DATA } from "../../../app.constants";
import type { Service } from "../../../../src/utils/types";

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

  it("should display long service card for detailed card service", async () => {
    const app = await appWithMiddlewareSetup({
      hasAccounts: true,
      hasServices: true,
      hasHMRC: true,
    });
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(testComponent("service-card-long")).length).to.not.equal(0);
        expect($(testComponent("service-card-short")).length).to.equal(0);
      });
  });

  it("should display short service card for non-detailed card services", async () => {
    const app = await appWithMiddlewareSetup({
      hasAccounts: true,
      hasServices: true,
    });
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(testComponent("service-card-short")).length).to.not.equal(0);
        expect($(testComponent("service-card-long")).length).to.equal(0);
      });
  });

  it("should not display a global notice paragraph when the page is being viewed in English, and English-only services have been visited", async () => {
    const app = await appWithMiddlewareSetup({
      hasAccounts: true,
      accountsList: [
        {
          client_id: "gov-uk",
          count_successful_logins: 1,
          last_accessed: 12312412532,
          last_accessed_readable_format: "",
          isAvailableInWelsh: false,
        },
      ],
    });
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(testComponent("no-welsh-notice-global")).length).to.equal(0);
      });
  });

  it("should display a global notice paragraph when the page is being viewed in Welsh, and English-only services have been visited", async () => {
    const app = await appWithMiddlewareSetup({
      hasAccounts: true,
      language: "cy",
      accountsList: [
        {
          client_id: "gov-uk",
          count_successful_logins: 1,
          last_accessed: 12312412532,
          last_accessed_readable_format: "",
          isAvailableInWelsh: false,
        },
      ],
    });
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(testComponent("no-welsh-notice-global")).length).to.equal(1);
      });
  });

  it("should not display an inline notice on English-only service cards, when the current language is English", async () => {
    const app = await appWithMiddlewareSetup({
      hasAccounts: true,
      hasServices: true,
      accountsList: [
        {
          client_id: "gov-uk",
          count_successful_logins: 1,
          last_accessed: 12312412532,
          last_accessed_readable_format: "",
          isAvailableInWelsh: false,
        },
      ],
      serviceList: [
        {
          client_id: "veteransCard",
          count_successful_logins: 1,
          last_accessed: 5436437332532,
          last_accessed_readable_format: "",
          isAvailableInWelsh: false,
        },
        {
          client_id: "dbs",
          count_successful_logins: 5,
          last_accessed: 46435423643,
          last_accessed_readable_format: "",
          isAvailableInWelsh: true,
        },
      ],
    });
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(testComponent("no-welsh-notice-inline")).length).to.equal(0);
      });
  });

  it("should display an inline notice on English-only service cards, when the current language is Welsh", async () => {
    const app = await appWithMiddlewareSetup({
      hasAccounts: true,
      hasServices: true,
      language: "cy",
      accountsList: [
        {
          client_id: "gov-uk",
          count_successful_logins: 1,
          last_accessed: 12312412532,
          last_accessed_readable_format: "",
          isAvailableInWelsh: false,
        },
      ],
      serviceList: [
        {
          client_id: "veteransCard",
          count_successful_logins: 1,
          last_accessed: 5436437332532,
          last_accessed_readable_format: "",
          isAvailableInWelsh: false,
        },
        {
          client_id: "dbs",
          count_successful_logins: 5,
          last_accessed: 46435423643,
          last_accessed_readable_format: "",
          isAvailableInWelsh: true,
        },
      ],
    });
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(testComponent("no-welsh-notice-inline")).length).to.equal(2);
      });
  });
});

const appWithMiddlewareSetup = async (data?: {
  hasAccounts?: boolean;
  hasServices?: boolean;
  serviceList?: Service[];
  accountsList?: Service[];
  hasHMRC?: boolean;
  language?: string;
}) => {
  decache("../../../app");
  decache("../../../middleware/requires-auth-middleware");
  const sandbox = sinon.createSandbox();
  const sessionMiddleware = require("../../../middleware/requires-auth-middleware");
  const yourServices = require("../../../utils/yourServices");
  const oidc = require("../../../utils/oidc");
  const params = data || {};
  const hasHMRC = params.hasHMRC || false;
  const language = params.language || "en";
  const accounts = params.hasAccounts || false;
  const services = params.hasServices || false;
  const serviceList = hasHMRC
    ? [
        {
          client_id: "hmrc",
          count_successful_logins: "1",
          last_accessed: "",
          last_accessed_readable_format: "",
          hasDetailedCard: true,
        },
      ]
    : [
        {
          client_id: "dbs",
          count_successful_logins: "1",
          last_accessed: "",
          last_accessed_readable_format: "",
        },
      ];
  const accountsList = params.accountsList || [
    {
      client_id: "gov-uk",
      count_successful_logins: "1",
      last_accessed: "",
      last_accessed_readable_format: "",
    },
  ];

  sandbox.stub(sessionMiddleware, "requiresAuthMiddleware").callsFake(function (
    req: any,
    res: any,
    next: any
  ): void {
    req.i18n.language = language;
    req.session.user = DEFAULT_USER_SESSION;
    next();
  });

  sandbox.stub(yourServices, "presentYourServices").callsFake(function () {
    return {
      accountsList: accounts ? accountsList : [],
      servicesList: services ? serviceList : [],
    };
  });
  sandbox.stub(oidc, "getOIDCClient").callsFake(() => {
    return Promise.resolve({});
  });

  sandbox.stub(oidc, "getCachedJWKS").callsFake(() => {
    return Promise.resolve({});
  });

  return await require("../../../app").createApp();
};
