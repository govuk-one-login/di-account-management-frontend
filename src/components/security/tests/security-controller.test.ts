import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { securityGet } from "../security-controller";

describe("security controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = { body: {}, session: { user: {} } as any };
    res = { render: sandbox.fake(), redirect: sandbox.fake(), locals: {} };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("securityGet", () => {
    it("should render security view", async () => {
      const configFuncs = require("../../../config");
      sandbox.stub(configFuncs, "supportActivityLog").callsFake(() => {
        return true;
      });
      const hasHmrcServiceStub = require("../../../middleware/check-allowed-services-list");
      sandbox.stub(hasHmrcServiceStub, "hasHmrcService").resolves(true);
      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        isPhoneNumberVerified: true,
      } as any;
      await securityGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("security/index.njk", {
        email: "test@test.com",
        phoneNumber: "7898",
        isPhoneNumberVerified: true,
        supportActivityLog: true,
        activityLogUrl: "/activity-history",
      });
    });
    it("should render security view without activity log", async () => {
      const configFuncs = require("../../../config");
      sandbox.stub(configFuncs, "supportActivityLog").callsFake(() => {
        return false;
      });
      const hasHmrcServiceStub = require("../../../middleware/check-allowed-services-list");
      sandbox.stub(hasHmrcServiceStub, "hasHmrcService").resolves(true);
      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        isPhoneNumberVerified: true,
      } as any;
      await securityGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("security/index.njk", {
        email: "test@test.com",
        phoneNumber: "7898",
        isPhoneNumberVerified: true,
        supportActivityLog: false,
        activityLogUrl: "/activity-history",
      });
    });
  });
});
