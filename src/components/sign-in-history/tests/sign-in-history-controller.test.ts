import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import { signInHistoryGet } from "../sign-in-history-controller";
import { getAppEnv } from "../../../config";
describe("Sign in history controller", () => {
  let sandbox: sinon.SinonSandbox;
  let res: Partial<Response>;
  const TEST_SUBJECT_ID = "testSubjectId";

  beforeEach(() => {
    res = { header: sandbox.fake(), render: sandbox.fake(), locals: {} };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("sign in history get", () => {
    sandbox = sinon.createSandbox();
    const signInHistory = require("../../../utils/signInHistory");
    it("should render the sign in history page with data", async () => {
      sandbox.stub(signInHistory, "presentSignInHistory").callsFake(() => {
        return new Promise((resolve) => {
          resolve([]);
        });
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
        log: { error: sandbox.fake() },
        i18n: { language: "en"}
      };
      await signInHistoryGet(req as Request, res as Response).then(() => {
        expect(res.render).to.have.been.calledWith(
          "sign-in-history/index.njk",
          {
            showExplanation: false,
            env: getAppEnv(),
            data: [],
            pagination: {},
          }
        );
      });
    });
  });
});
