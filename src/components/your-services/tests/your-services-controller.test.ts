import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import { yourServicesGet } from "../your-services-controller";
import { getAppEnv } from "../../../config";
describe("your services controller", () => {
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
      i18n: { language: "en"},
    };
  }

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    res = { render: sandbox.fake(), redirect: sandbox.fake(), locals: {} };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("yourServicesGet", () => {
    it("should render your services page with data", async () => {
      req = validRequest();
      await yourServicesGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith("your-services/index.njk", {
        email: "test@test.com",
        accountsList: [],
        servicesList: [],
        env: getAppEnv(),
      });
    });

    it("should render your services page with email ", async () => {
      const req: any = {
        body: {},
        session: {
          user: { email: "test@test.com" },
          destroy: sandbox.fake(),
        },
      };

      await yourServicesGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith("your-services/index.njk", {
        email: "test@test.com",
        env: getAppEnv(),
      });
    });
  });
});
