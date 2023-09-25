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

describe("Integration:: Sign in history", () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  it("should return sign in history page", async () => {
    const app = await appWithMiddlewareSetup();
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(testComponent("sign-in-history")).length).to.equal(1);
      });
  });

  it("should not return sign in history page if feature flag is off", async () => {
    const app = await appWithMiddlewareSetup([], { hideActivityLog: true });
    await request(app)
      .get(url)
      .expect(function (res) {
        expect(res.status).to.equal(404);
      });
  });

  it("should display without pagination when data is less than activityLogItemsPerPage", async () => {
    const dataLong = [
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
    const app = await appWithMiddlewareSetup(dataLong);
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(testComponent("activity-log-pagination")).length).to.equal(0);
      });
  });

  it("should display with pagination when data is more than activityLogItemsPerPage", async () => {
    const dataLong = [
      {
        event_type: "signed-in",
        session_id: "asdf",
        user_id: "string",
        timestamp: "1689210000",
      },
      {
        event_type: "created",
        session_id: "asdf",
        user_id: "string",
        timestamp: "1699210000",
        truncated: false,
      },
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
    const app = await appWithMiddlewareSetup(dataLong);
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(testComponent("activity-log-pagination")).length).to.equal(1);
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
        activities: [
          {
            type: "visited",
            client_id: "RqFZ83csmS4Mi4Y7s7ohD9-ekwU",
            timestamp: "1689210000",
          },
        ],
        truncated: false,
      },
    ];
    const app = await appWithMiddlewareSetup(dataWithoutCreated);
    await request(app)
      .get(url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect(res.status).to.equal(200);
        expect($(testComponent("activity-log-explainer")).length).to.equal(0);
      });
  });
});

const appWithMiddlewareSetup = async (data?: any, config?: any) => {
  decache("../../../app");
  decache("../../../middleware/requires-auth-middleware");
  const oidc = require("../../../utils/oidc");
  const configFuncs = require("../../../config");
  const activityLogMiddleware = require("../../../middleware/activity-log-middleware");
  const sessionMiddleware = require("../../../middleware/requires-auth-middleware");
  const sandbox = sinon.createSandbox();
  const showActivityLog = !config?.hideActivityLog;
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

  sandbox
    .stub(sessionMiddleware, "requiresAuthMiddleware")
    .callsFake(function (req: any, res: any, next: any): void {
      req.session.user = DEFAULT_USER_SESSION;
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

  sandbox.stub(activityLogMiddleware, "getActivityLog").callsFake(function () {
    return activity;
  });

  sandbox.stub(configFuncs, "supportActivityLog").callsFake(() => {
    return showActivityLog;
  });
  return await require("../../../app").createApp();
};
