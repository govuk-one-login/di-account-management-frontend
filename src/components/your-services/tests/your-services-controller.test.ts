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

  describe("yourServicesGet", () => {
    it("should render your services page with data", async () => {
      req = validRequest();
      await yourServicesGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith("your-services/index.njk", {
        email: "test@test.com",
        currentLngWelsh: false,
        accountsList: [],
        servicesList: [],
        env: getAppEnv(),
        hasEnglishOnlyServices: false,
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
        currentLngWelsh: false,
      });
    });

    it("should render your services page with English-only services flag, if there are English-only accounts", async () => {
      const yourServices = require("../../../utils/yourServices");
      req = validRequest();

      sandbox.stub(yourServices, "presentYourServices").callsFake(function () {
        return {
          accountsList: [
            {
              client_id: "gov-uk",
              count_successful_logins: 1,
              last_accessed: 12312412532,
              last_accessed_readable_format: "",
              isAvailableInWelsh: false,
            },
          ],
          servicesList: [
            {
              client_id: "veteransCard",
              count_successful_logins: 1,
              last_accessed: 5436437332532,
              last_accessed_readable_format: "",
              isAvailableInWelsh: true,
            },
          ],
        };
      });

      await yourServicesGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith("your-services/index.njk", {
        email: "test@test.com",
        accountsList: [
          {
            client_id: "gov-uk",
            count_successful_logins: 1,
            last_accessed: 12312412532,
            last_accessed_readable_format: "",
            isAvailableInWelsh: false,
          },
        ],
        servicesList: [
          {
            client_id: "veteransCard",
            count_successful_logins: 1,
            last_accessed: 5436437332532,
            last_accessed_readable_format: "",
            isAvailableInWelsh: true,
          },
        ],
        env: getAppEnv(),
        currentLngWelsh: false,
        hasEnglishOnlyServices: true,
      });
    });

    it("should render your services page with English-only services flag, if there are English-only services", async () => {
      const yourServices = require("../../../utils/yourServices");
      req = validRequest();

      sandbox.stub(yourServices, "presentYourServices").callsFake(function () {
        return {
          accountsList: [
            {
              client_id: "gov-uk",
              count_successful_logins: 1,
              last_accessed: 12312412532,
              last_accessed_readable_format: "",
              isAvailableInWelsh: true,
            },
          ],
          servicesList: [
            {
              client_id: "veteransCard",
              count_successful_logins: 1,
              last_accessed: 5436437332532,
              last_accessed_readable_format: "",
              isAvailableInWelsh: false,
            },
          ],
        };
      });

      await yourServicesGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith("your-services/index.njk", {
        email: "test@test.com",
        accountsList: [
          {
            client_id: "gov-uk",
            count_successful_logins: 1,
            last_accessed: 12312412532,
            last_accessed_readable_format: "",
            isAvailableInWelsh: true,
          },
        ],
        servicesList: [
          {
            client_id: "veteransCard",
            count_successful_logins: 1,
            last_accessed: 5436437332532,
            last_accessed_readable_format: "",
            isAvailableInWelsh: false,
          },
        ],
        env: getAppEnv(),
        currentLngWelsh: false,
        hasEnglishOnlyServices: true,
      });
    });
  });
});
