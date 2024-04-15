import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import { yourServicesGet } from "../your-services-controller";
import { getAppEnv } from "../../../config";
import {
  CURRENT_EMAIL,
  ENGLISH,
  ORIGINAL_URL,
  RequestBuilder,
} from "../../../../test/utils/builders";
describe("your services controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
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
      req = new RequestBuilder().build();
      await yourServicesGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith("your-services/index.njk", {
        email: CURRENT_EMAIL,
        accountsList: [],
        servicesList: [],
        env: getAppEnv(),
        language: ENGLISH,
        currentUrl: ORIGINAL_URL,
        baseUrl: "https://www.gov.uk",
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
