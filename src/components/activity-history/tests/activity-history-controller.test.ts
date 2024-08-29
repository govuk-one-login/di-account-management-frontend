import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { PATH_DATA } from "../../../app.constants";
import { activityHistoryGet } from "../activity-history-controller";
import { getAppEnv } from "../../../config";
describe("Activity history controller", () => {
  let sandbox: sinon.SinonSandbox;
  let res: Partial<Response>;
  const TEST_SUBJECT_ID = "testSubjectId";

  beforeEach(() => {
    res = { render: sandbox.fake(), locals: {} };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("sign in history get", () => {
    sandbox = sinon.createSandbox();
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
      };
      await activityHistoryGet(req as Request, res as Response).then(() => {
        expect(res.render).to.have.been.calledWith(
          "activity-history/index.njk",
          {
            env: getAppEnv(),
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
  });
});
