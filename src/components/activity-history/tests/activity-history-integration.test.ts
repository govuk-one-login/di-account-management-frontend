import request from "supertest";
import { describe } from "mocha";
import { sinon, expect } from "../../../../test/utils/test-utils";
import { testComponent } from "../../../../test/utils/helpers";
import * as cheerio from "cheerio";
import * as nock from "nock";
import decache from "decache";
import { PATH_DATA } from "../../../app.constants";

const { url } = PATH_DATA.SIGN_IN_HISTORY;

const DEFAULT_USER_SESSION = {
  email: "test@test.com",
  isPhoneNumberVerified: true,
  isAuthenticated: true,
  subjectId: "asdf",
  state: {},
  tokens: {
    accessToken: "token",
    idToken: "Idtoken",
    refreshToken: "token",
  },
};

describe("Integration:: Activity history", () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  it("should return Activity History page with an Activity History section", async () => {
    const app = await appWithMiddlewareSetup();
    await request(app)
      .get(url)
      .expect(200)
      .expect(function (res) {
        expect(cheerio.load(res.text)("[id='activity-history']").length).eq(1);
      });
  });

  it("should not return Activity History page if feature flag is off", async () => {
    const app = await appWithMiddlewareSetup([], { hideActivityLog: true });
    await request(app).get(url).expect(404);
  });

  it("should never show link to external reporting form when OLH report suspicious activity journey is enabled", async () => {
    const app = await appWithMiddlewareSetup(
      [
        {
          event_type: "AUTH_AUTH_CODE_ISSUED",
          session_id: "asdf",
          user_id: "string",
          timestamp: "1689210000",
          truncated: false,
          client_id: "vehicleOperatorLicense",
        },
      ],
      {
        reportSuspiciousActivityJourneyDisabled: false,
      }
    );
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect(
          $(testComponent("content-for-reporting-form-disabled")).length
        ).eq(0);
        expect(
          $(testComponent("content-for-reporting-form-enabled")).length
        ).eq(0);
      });
  });

  it("should show link to reporting form by default", async () => {
    const app = await appWithMiddlewareSetup(
      [
        {
          event_type: "AUTH_AUTH_CODE_ISSUED",
          session_id: "asdf",
          user_id: "string",
          timestamp: "1689210000",
          truncated: false,
          client_id: "vehicleOperatorLicense",
        },
      ],
      {
        reportSuspiciousActivityJourneyDisabled: true,
      }
    );
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect(
          $(testComponent("content-for-reporting-form-enabled")).length
        ).eq(1);
        expect(
          $(testComponent("content-for-reporting-form-disabled")).length
        ).eq(0);
      });
  });

  it("should show the correct content when reporting form is disabled", async () => {
    const app = await appWithMiddlewareSetup(
      [
        {
          event_type: "AUTH_AUTH_CODE_ISSUED",
          session_id: "asdf",
          user_id: "string",
          timestamp: "1689210000",
          truncated: false,
          client_id: "vehicleOperatorLicense",
        },
      ],
      {
        hideReportingForm: true,
        reportSuspiciousActivityJourneyDisabled: true,
      }
    );
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect(
          $(testComponent("content-for-reporting-form-disabled")).length
        ).eq(1);
        expect(
          $(testComponent("content-for-reporting-form-enabled")).length
        ).eq(0);
      });
  });

  it("should redirect if the user does not have allowed services on the list", async () => {
    const app = await appWithMiddlewareSetup([], {
      hideActivityLog: false,
      hasAllowedActivityLogServices: false,
    });
    const response = await request(app).get(url);
    expect(response.status).to.equal(302);
    expect(response.header.location).to.equal(PATH_DATA.SECURITY.url);
  });

  it("should display without pagination when data is less than activityLogItemsPerPage", async () => {
    const dataShort = [
      {
        event_type: "AUTH_AUTH_CODE_ISSUED",
        session_id: "asdf",
        user_id: "string",
        timestamp: "1689210000",
        truncated: false,
        client_id: "vehicleOperatorLicense",
      },
      {
        event_type: "AUTH_AUTH_CODE_ISSUED",
        session_id: "asdf",
        user_id: "string",
        timestamp: "1699210000",
        truncated: false,
        client_id: "vehicleOperatorLicense",
      },
    ];
    const app = await appWithMiddlewareSetup(dataShort);
    await request(app)
      .get(url)
      .expect(200)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("activity-log-pagination")).length).eq(0);
        expect($("ul.activity-history__list").find("li").length).eq(2);
      });
  });

  it("should display with pagination when data is more than activityLogItemsPerPage", async () => {
    const event = {
      event_type: "AUTH_AUTH_CODE_ISSUED",
      session_id: "asdf",
      user_id: "string",
      timestamp: "1699210000",
      truncated: false,
      client_id: "vehicleOperatorLicense",
    };

    const dataLong = new Array(12).fill(event);
    const app = await appWithMiddlewareSetup(dataLong);
    await request(app)
      .get(url)
      .expect(200)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("activity-log-pagination")).length).eq(1);
      });
  });

  it("should display an introductory paragraph if the first event in the log is older than feature launch date", async () => {
    const dataWithoutCreated = [
      {
        event_type: "signed-in",
        session_id: "asdf",
        user_id: "string",
        // Sun Jan 29 2023
        timestamp: "1675032269060",
        truncated: false,
      },
    ];
    const app = await appWithMiddlewareSetup(dataWithoutCreated);
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(testComponent("activity-log-explainer")).length).eq(0);
      });
  });

  describe("generate the correct markup for different languages", () => {
    it("should display the correct markup if the current language is Welsh and an English-only service exists in the log", async () => {
      const app = await appWithMiddlewareSetup(
        [
          {
            event_type: "AUTH_AUTH_CODE_ISSUED",
            session_id: "asdf",
            user_id: "string",
            timestamp: "1689210000",
            truncated: false,
            client_id: "apprenticeshipsService",
          },
        ],
        { language: "cy" }
      );
      await request(app)
        .get(url)
        .expect(function (res) {
          const $ = cheerio.load(res.text);
          expect(res.status).to.equal(200);
          expect($(testComponent("no-welsh-notice")).length).eq(1);
          expect($(testComponent("log-entry-heading")).prop("lang")).to.equal(
            "en"
          );
        });
    });
  });

  it("should not add intro paragraph and lang attributes when current language is English and an English-only service exists", async () => {
    const app = await appWithMiddlewareSetup([
      {
        event_type: "AUTH_AUTH_CODE_ISSUED",
        session_id: "asdf",
        user_id: "string",
        timestamp: "1689210000",
        truncated: false,
        client_id: "dfeApplyForTeacherTraining",
      },
    ]);
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(testComponent("no-welsh-notice")).length).eq(0);
        expect($(`[lang='en']${testComponent("log-entry-heading")}`).length).eq(
          0
        );
      });
  });

  it("should not add intro paragraph and lang attributes when current language is Welsh and all services are available in Welsh", async () => {
    const app = await appWithMiddlewareSetup(
      [
        {
          event_type: "AUTH_AUTH_CODE_ISSUED",
          session_id: "asdf",
          user_id: "string",
          timestamp: "1689210000",
          truncated: false,
          client_id: "dbs",
        },
      ],
      { language: "cy" }
    );
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(testComponent("no-welsh-notice")).length).eq(0);
        expect($(`[lang='en']${testComponent("log-entry-heading")}`).length).eq(
          0
        );
      });
  });
});

const appWithMiddlewareSetup = async (data?: any, config?: any) => {
  decache("../../../app");
  decache("../../../middleware/requires-auth-middleware");
  const oidc = require("../../../utils/oidc");
  const configFuncs = require("../../../config");
  const presentActivityHistory = require("../../../utils/present-activity-history");
  const sessionMiddleware = require("../../../middleware/requires-auth-middleware");
  const sandbox = sinon.createSandbox();
  const showActivityLog = !config?.hideActivityLog;
  const supportReportingForm = !config?.hideReportingForm;
  const reportSuspiciousActivity =
    !config?.reportSuspiciousActivityJourneyDisabled;
  const language = config?.language || "en";
  const checkAllowedServicesList = require("../../../middleware/check-allowed-services-list");

  const activity = data || [
    {
      event_type: "signed-in",
      session_id: "asdf",
      user_id: "string",
      timestamp: "1689210000",
      activities: [
        {
          type: "visited",
          client_id: "RqFZ83csmS4Mi4Y7s7ohD9-ekwU",
          timestamp: "1689210000",
        },
      ],
      truncated: false,
    },
    {
      event_type: "created",
      session_id: "asdf",
      user_id: "string",
      timestamp: "1699210000",
      truncated: false,
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

  sandbox
    .stub(presentActivityHistory, "presentActivityHistory")
    .callsFake(function () {
      return activity;
    });

  sandbox.stub(configFuncs, "supportActivityLog").callsFake(() => {
    return showActivityLog;
  });

  sandbox.stub(configFuncs, "supportReportingForm").callsFake(() => {
    return supportReportingForm;
  });

  sandbox.stub(configFuncs, "reportSuspiciousActivity").callsFake(() => {
    return reportSuspiciousActivity;
  });

  sandbox
    .stub(checkAllowedServicesList, "hasAllowedActivityLogServices")
    .resolves(config?.hasAllowedActivityLogServices ?? true);

  return await require("../../../app").createApp();
};
