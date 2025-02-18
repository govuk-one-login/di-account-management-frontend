import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { PATH_DATA } from "../../../app.constants";
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
          return new Promise((resolve) => {
            resolve([]);
          });
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
            contactLink: PATH_DATA.CONTACT.url,
            homeClientId: clientId,
          }
        );
      });
    });

    it("should render error when user id is missing", async () => {
      sandbox
        .stub(presentActivityHistoryModule, "presentActivityHistory")
        .callsFake(() => {
          return new Promise((resolve) => {
            resolve([]);
          });
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
