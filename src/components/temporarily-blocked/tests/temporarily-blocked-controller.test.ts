import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { temporarilyBlockedGet } from "../temporarily-blocked-controller";

describe("temporarily blocked controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  const TEST_SUBJECT_ID = "testSubjectId";
  function validRequest(): any {
    return {
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
        user: { subjectId: TEST_SUBJECT_ID, email: "test@test.com" },
        destroy: sandbox.fake(),
      },
      log: { error: sandbox.fake() },
      i18n: { language: "en" },
    };
  }

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      locals: {},
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("temporarilyBlockedGet", () => {
    it("should render the temporarily blocked view", () => {
      req = validRequest();
      temporarilyBlockedGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("temporarily-blocked/index.njk");
    });
  });
});
