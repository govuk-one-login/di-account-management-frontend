import { expect } from "chai";
import { describe } from "mocha";
import { NextFunction } from "express";
import sinon from "sinon";
import {
  checkActivityLogAllowedServicesList,
  checkRSAAllowedServicesList,
  findClientInServices,
} from "../../../src/middleware/check-allowed-services-list";
import * as yourServices from "../../../src/utils/yourServices";
import * as configFuncs from "../../../src/config";
import * as allowListFuncs from "../../../src/middleware/check-allowed-services-list";
import { LOG_MESSAGES, PATH_DATA } from "../../../src/app.constants";

describe("activity history allowlist middleware", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("checkActivityLogAllowedServicesList function", () => {
    it("calls next function if list of user services contains activity history allowlisted RPs", async () => {
      const yourNewServices = [
        {
          client_id: "prisonVisits",
          count_successful_logins: 1,
          last_accessed: 14567776,
          last_accessed_readable_format: "last_accessed_readable_format",
          hasDetailedCard: true,
        },
        {
          client_id: "mortgageDeed",
          count_successful_logins: 1,
          last_accessed: 14567776,
          last_accessed_readable_format: "last_accessed_readable_format",
          hasDetailedCard: true,
        },
      ];
      const yourNewAllowlist = ["prisonVisits"];
      const containsRps = findClientInServices(
        yourNewAllowlist,
        yourNewServices
      );
      sandbox.stub(yourServices, "getServices").resolves(yourNewServices);
      sandbox
        .stub(configFuncs, "activityLogAllowList")
        .resolves(yourNewAllowlist);
      sandbox.stub(allowListFuncs, "findClientInServices").returns(containsRps);
      const req: any = {
        session: {
          user: {
            isAuthenticated: false,
          } as any,
        },
        cookies: {
          lo: "true",
        },
        log: {
          info: sinon.fake(),
        },
      };

      const res: any = { locals: {}, redirect: sinon.fake() };
      expect(containsRps).equal(true);
      const nextFunction: NextFunction = sinon.fake(() => {});
      await checkActivityLogAllowedServicesList(req, res, nextFunction);
      expect(nextFunction).to.have.been.calledOnce;
    });

    it("redirects if list of user services does not contain activity history allowlisted RPs", async () => {
      const configFuncs = require("../../../src/config");
      sandbox.stub(yourServices, "getServices").resolves([
        {
          client_id: "prisonVisits",
          count_successful_logins: 1,
          last_accessed: 14567776,
          last_accessed_readable_format: "last_accessed_readable_format",
          hasDetailedCard: true,
        },
        {
          client_id: "mortgageDeed",
          count_successful_logins: 1,
          last_accessed: 14567776,
          last_accessed_readable_format: "last_accessed_readable_format",
          hasDetailedCard: true,
        },
      ]);
      sandbox.stub(configFuncs, "activityLogAllowList").returns(["gov-uk"]);
      const req: any = {
        session: {
          user: {
            isAuthenticated: false,
          } as any,
        },
        cookies: {
          lo: "true",
        },
        log: {
          info: sinon.fake(),
        },
      };

      const res: any = { locals: { trace: {} }, redirect: sinon.fake() };
      const nextFunction: NextFunction = sinon.fake(() => {});
      await checkActivityLogAllowedServicesList(req, res, nextFunction);
      expect(res.redirect).to.have.been.calledWith(PATH_DATA.SECURITY.url);
      expect(req.log.info).to.have.been.calledWith(
        { trace: {} },
        LOG_MESSAGES.ILLEGAL_ATTEMPT_TO_ACCESS_ACTIVITY_LOG
      );
    });
  });

  describe("checkRSAAllowedServicesList function", () => {
    it("calls next function if list of user services contains RSA allowlisted RPs", async () => {
      const yourNewServices = [
        {
          client_id: "prisonVisits",
          count_successful_logins: 1,
          last_accessed: 14567776,
          last_accessed_readable_format: "last_accessed_readable_format",
          hasDetailedCard: true,
        },
        {
          client_id: "mortgageDeed",
          count_successful_logins: 1,
          last_accessed: 14567776,
          last_accessed_readable_format: "last_accessed_readable_format",
          hasDetailedCard: true,
        },
      ];
      const yourNewAllowlist = ["prisonVisits"];
      const containsRps = findClientInServices(
        yourNewAllowlist,
        yourNewServices
      );
      sandbox.stub(yourServices, "getServices").resolves(yourNewServices);
      sandbox
        .stub(configFuncs, "activityLogAllowList")
        .resolves(yourNewAllowlist);
      sandbox.stub(allowListFuncs, "findClientInServices").returns(containsRps);
      const req: any = {
        session: {
          user: {
            isAuthenticated: false,
          } as any,
        },
        cookies: {
          lo: "true",
        },
        log: {
          info: sinon.fake(),
        },
      };

      const res: any = { locals: {}, redirect: sinon.fake() };
      expect(containsRps).equal(true);
      const nextFunction: NextFunction = sinon.fake(() => {});
      await checkRSAAllowedServicesList(req, res, nextFunction);
      expect(nextFunction).to.have.been.calledOnce;
    });

    it("redirects if list of user services does not contain RSA allowlisted RPs", async () => {
      const configFuncs = require("../../../src/config");
      sandbox.stub(yourServices, "getServices").resolves([
        {
          client_id: "prisonVisits",
          count_successful_logins: 1,
          last_accessed: 14567776,
          last_accessed_readable_format: "last_accessed_readable_format",
          hasDetailedCard: true,
        },
        {
          client_id: "mortgageDeed",
          count_successful_logins: 1,
          last_accessed: 14567776,
          last_accessed_readable_format: "last_accessed_readable_format",
          hasDetailedCard: true,
        },
      ]);
      sandbox.stub(configFuncs, "activityLogAllowList").returns(["gov-uk"]);
      const req: any = {
        session: {
          user: {
            isAuthenticated: false,
          } as any,
        },
        cookies: {
          lo: "true",
        },
        log: {
          info: sinon.fake(),
        },
      };

      const res: any = { locals: { trace: {} }, redirect: sinon.fake() };
      const nextFunction: NextFunction = sinon.fake(() => {});
      await checkRSAAllowedServicesList(req, res, nextFunction);
      expect(res.redirect).to.have.been.calledWith(PATH_DATA.SECURITY.url);
      expect(req.log.info).to.have.been.calledWith(
        { trace: {} },
        LOG_MESSAGES.ILLEGAL_ATTEMPT_TO_ACCESS_RSA
      );
    });
  });
});
