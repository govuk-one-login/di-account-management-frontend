import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { PATH_DATA, EXTERNAL_URLS } from "../../../app.constants";
import { activityHistoryGet } from "../activity-history-controller";
import { getAppEnv, reportSuspiciousActivity } from "../../../config";
import { logger } from "../../../utils/logger";
describe("Activity history controller", () => {
  let sandbox: sinon.SinonSandbox;
  let res: Partial<Response>;
  const TEST_SUBJECT_ID = "testSubjectId";
  let errorLoggerSpy: sinon.SinonSpy;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    res = {
      render: sandbox.fake(),
      locals: { sessionId: "testSessionId" },
      status: sandbox.fake(),
    };
    errorLoggerSpy = sinon.spy(logger, "error");
  });

  afterEach(() => {
    sandbox.restore();
    errorLoggerSpy.restore();
  });

  describe("sign in history get", () => {
    const config = require("../../../config");
    const presentActivityHistoryModule = require("../../../utils/present-activity-history");

    it("should render the sign in history page with data", async () => {
      sandbox
        .stub(presentActivityHistoryModule, "presentActivityHistory")
        .callsFake(() => {
          return Promise.resolve([]);
        });

      const clientId = "clientId";
      sandbox.stub(config, "getOIDCClientId").callsFake(() => {
        return clientId;
      });

      const req: any = {
        app: {
          locals: {
            sessionStore: {
              destroy: sandbox.fake(),
            },
            subjectSessionIndexService: {
              removeSession: sandbox.fake(),
              getSessions: sandbox.stub().resolves(["session-1", "session-2"]),
            },
          },
        },
        body: {},
        session: {
          user: { subjectId: TEST_SUBJECT_ID },
          query: {},
          destroy: sandbox.fake(),
        },
        log: { error: sandbox.fake(), info: sandbox.fake() },
        i18n: { language: "en" },
        t: (k: string) => k,
      };
      await activityHistoryGet(req as Request, res as Response).then(() => {
        expect(res.render).to.have.been.calledWithMatch(
          "activity-history/index.njk",
          {
            env: getAppEnv(),
            reportSuspiciousActivity: reportSuspiciousActivity(),
            data: [],
            pagination: {},
            backLink: PATH_DATA.SECURITY.url,
            changePasswordLink: PATH_DATA.SECURITY.url,
            contactLink: EXTERNAL_URLS.AUTH_REPORTING_FORM,
            homeClientId: clientId,
            supportReportingForm: false,
            hasEnglishOnlyServices: false,
          }
        );
      });
    });

    it("should render with hasEnglishOnlyServices: true if data contains an English-only service", async () => {
      sandbox
        .stub(presentActivityHistoryModule, "presentActivityHistory")
        .callsFake(() => {
          return [
            {
              event_type: "AUTH_AUTH_CODE_ISSUED",
              session_id: "asdf",
              user_id: "string",
              timestamp: "1689210000",
              truncated: false,
              client_id: "apprenticeshipsService",
            },
          ];
        });

      const clientId = "clientId";
      sandbox.stub(config, "getOIDCClientId").callsFake(() => {
        return clientId;
      });

      const req: any = {
        app: {
          locals: {
            sessionStore: {
              destroy: sandbox.fake(),
            },
            subjectSessionIndexService: {
              removeSession: sandbox.fake(),
              getSessions: sandbox.stub().resolves(["session-1", "session-2"]),
            },
          },
        },
        body: {},
        session: {
          user: { subjectId: TEST_SUBJECT_ID },
          query: {},
          destroy: sandbox.fake(),
        },
        log: { error: sandbox.fake(), info: sandbox.fake() },
        t: (k: string) => k,
      };
      await activityHistoryGet(req as Request, res as Response).then(() => {
        expect(res.render).to.have.been.calledWithMatch(
          "activity-history/index.njk",
          {
            env: getAppEnv(),
            reportSuspiciousActivity: reportSuspiciousActivity(),
            data: [
              {
                eventType: "signedIn",
                eventId: undefined,
                sessionId: "asdf",
                clientId: "apprenticeshipsService",
                reportedSuspicious: undefined,
                reportSuspiciousActivityUrl:
                  "/activity-history/report-activity?event=undefined&page=1",
                time: "13 July 2023 at 2:00 am",
                visitedService: "apprenticeshipsService",
                visitedServiceId: "apprenticeshipsService",
                reportNumber: undefined,
                isAvailableInWelsh: false,
              },
            ],
            pagination: {},
            backLink: PATH_DATA.SECURITY.url,
            changePasswordLink: PATH_DATA.SECURITY.url,
            contactLink: EXTERNAL_URLS.AUTH_REPORTING_FORM,
            homeClientId: clientId,
            supportReportingForm: false,
            hasEnglishOnlyServices: true,
          }
        );
      });
    });

    it("should render error when user id is missing", async () => {
      sandbox
        .stub(presentActivityHistoryModule, "presentActivityHistory")
        .callsFake(() => {
          return Promise.resolve([]);
        });

      const clientId = "clientId";
      sandbox.stub(config, "getOIDCClientId").callsFake(() => {
        return clientId;
      });

      const req: any = {
        app: {
          locals: {
            sessionStore: {
              destroy: sandbox.fake(),
            },
            subjectSessionIndexService: {
              removeSession: sandbox.fake(),
              getSessions: sandbox.stub().resolves(["session-1", "session-2"]),
            },
          },
        },
        body: {},
        session: {
          user: { subjectId: undefined },
          query: {},
          destroy: sandbox.fake(),
        },
        log: { error: sandbox.fake(), info: sandbox.fake() },
        i18n: { language: "en" },
        t: (k: string) => k,
      };
      await activityHistoryGet(req as Request, res as Response);
      expect(errorLoggerSpy).to.have.been.calledWith(
        "Activity history controller: user_id missing from session"
      );
    });

    it("should render error during activity history get", async () => {
      sandbox
        .stub(presentActivityHistoryModule, "presentActivityHistory")
        .callsFake(() => {
          return Promise.resolve(new Error("An error occurred"));
        });

      const clientId = "clientId";
      sandbox.stub(config, "getOIDCClientId").callsFake(() => {
        return clientId;
      });

      const req: any = {
        app: {
          locals: {
            sessionStore: {
              destroy: sandbox.fake(),
            },
            subjectSessionIndexService: {
              removeSession: sandbox.fake(),
              getSessions: sandbox.stub().resolves(["session-1", "session-2"]),
            },
          },
        },
        body: {},
        session: {
          user: { subjectId: TEST_SUBJECT_ID },
          query: {},
          destroy: sandbox.fake(),
        },
        log: { error: sandbox.fake(), info: sandbox.fake() },
        i18n: { language: "en" },
        t: (k: string) => k,
      };
      await activityHistoryGet(req as Request, res as Response).then(() => {
        expect(errorLoggerSpy).to.have.been.calledWith(
          "Activity-history-controller: Error during activity history get TypeError: activityLogs is not iterable"
        );
        expect(res.render).to.have.been.calledWithMatch(
          "common/errors/500.njk"
        );
      });
    });
  });
});
