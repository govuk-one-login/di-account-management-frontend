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
    req = { body: {}, session: { user: {} } as any, t: (k) => k };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      locals: {},
    };
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
      sandbox.stub(configFuncs, "supportChangeMfa").callsFake(() => {
        return true;
      });
      sandbox.stub(configFuncs, "supportAddBackupMfa").callsFake(() => {
        return true;
      });
      const allowedServicesModule = require("../../../middleware/check-allowed-services-list");
      sandbox
        .stub(allowedServicesModule, "hasAllowedRSAServices")
        .resolves(true);
      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        isPhoneNumberVerified: true,
      } as any;
      req.session.mfaMethods = [
        {
          mfaIdentifier: 1,
          priorityIdentifier: "DEFAULT",
          method: {
            mfaMethodType: "SMS",
            PhoneNumber: "xxxxxxx7898",
          },
          methodVerified: true,
        },
      ] as any;

      await securityGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("security/index.njk", {
        email: "test@test.com",
        supportActivityLog: true,
        activityLogUrl: "/activity-history",
        enterPasswordUrl: "/enter-password?from=security",
        mfaMethods: [
          {
            text: "pages.security.mfaSection.supportChangeMfa.defaultMethod.phoneNumber.title",
            linkHref: "/enter-password?from=security&type=changePhoneNumber",
            linkText:
              "pages.security.mfaSection.supportChangeMfa.defaultMethod.phoneNumber.change",
            priorityIdentifier: "DEFAULT",
          },
        ],
        supportChangeMfa: true,
        supportAddBackupMfa: true,
        canChangeTypeofPrimary: true,
      });
    });

    it("should render security view without activity log when the feature flag is off", async () => {
      const configFuncs = require("../../../config");
      sandbox.stub(configFuncs, "supportActivityLog").callsFake(() => {
        return false;
      });
      sandbox.stub(configFuncs, "supportChangeMfa").callsFake(() => {
        return true;
      });
      sandbox.stub(configFuncs, "supportAddBackupMfa").callsFake(() => {
        return true;
      });
      const allowedServicesModule = require("../../../middleware/check-allowed-services-list");
      sandbox.stub(allowedServicesModule, "hasHmrcService").resolves(true);
      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        isPhoneNumberVerified: true,
      } as any;
      req.session.mfaMethods = [
        {
          mfaIdentifier: 1,
          priorityIdentifier: "DEFAULT",
          method: {
            mfaMethodType: "SMS",
            phoneNumber: "xxxxxxx7898",
          },
          methodVerified: true,
        },
      ] as any;

      await securityGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("security/index.njk", {
        email: "test@test.com",
        supportActivityLog: false,
        activityLogUrl: "/activity-history",
        enterPasswordUrl: "/enter-password?from=security",
        mfaMethods: [
          {
            text: "pages.security.mfaSection.supportChangeMfa.defaultMethod.phoneNumber.title",
            linkHref: "/enter-password?from=security&type=changePhoneNumber",
            linkText:
              "pages.security.mfaSection.supportChangeMfa.defaultMethod.phoneNumber.change",
            priorityIdentifier: "DEFAULT",
          },
        ],
        supportChangeMfa: true,
        supportAddBackupMfa: true,
        canChangeTypeofPrimary: true,
      });
    });

    it("should render security view without activity log when the user doesn't have a supported service", async () => {
      const configFuncs = require("../../../config");
      sandbox.stub(configFuncs, "supportActivityLog").callsFake(() => {
        return true;
      });
      sandbox.stub(configFuncs, "supportChangeMfa").callsFake(() => {
        return true;
      });
      sandbox.stub(configFuncs, "supportAddBackupMfa").callsFake(() => {
        return true;
      });
      const allowedServicesModule = require("../../../middleware/check-allowed-services-list");
      sandbox
        .stub(allowedServicesModule, "hasAllowedRSAServices")
        .resolves(false);
      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        isPhoneNumberVerified: true,
      } as any;
      req.session.mfaMethods = [
        {
          mfaIdentifier: 1,
          priorityIdentifier: "DEFAULT",
          method: {
            mfaMethodType: "SMS",
            PhoneNumber: "xxxxxxx7898",
          },
          methodVerified: true,
        },
      ] as any;

      await securityGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("security/index.njk", {
        email: "test@test.com",
        supportActivityLog: false,
        activityLogUrl: "/activity-history",
        enterPasswordUrl: "/enter-password?from=security",
        mfaMethods: [
          {
            text: "pages.security.mfaSection.supportChangeMfa.defaultMethod.phoneNumber.title",
            linkHref: "/enter-password?from=security&type=changePhoneNumber",
            linkText:
              "pages.security.mfaSection.supportChangeMfa.defaultMethod.phoneNumber.change",
            priorityIdentifier: "DEFAULT",
          },
        ],
        supportChangeMfa: true,
        supportAddBackupMfa: true,
        canChangeTypeofPrimary: true,
      });
    });

    it("throws an error when the mfaMethodType is undefined", async () => {
      const configFuncs = require("../../../config");
      sandbox.stub(configFuncs, "supportActivityLog").callsFake(() => {
        return true;
      });
      sandbox.stub(configFuncs, "supportChangeMfa").callsFake(() => {
        return true;
      });
      const allowedServicesModule = require("../../../middleware/check-allowed-services-list");
      sandbox
        .stub(allowedServicesModule, "hasAllowedRSAServices")
        .resolves(false);
      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        isPhoneNumberVerified: true,
      } as any;
      req.session.mfaMethods = [
        {
          mfaIdentifier: 1,
          priorityIdentifier: "DEFAULT",
          method: {
            mfaMethodType: "SMS",
            PhoneNumber: "xxxxxxx7898",
          },
          methodVerified: true,
        },
      ] as any;

      expect(
        securityGet(req as Request, res as Response)
      ).to.eventually.be.rejectedWith("Unexpected mfaMethodType: undefined");
    });

    it("throws an error when the mfaMethodType is not unknown", async () => {
      const configFuncs = require("../../../config");
      sandbox.stub(configFuncs, "supportActivityLog").callsFake(() => {
        return true;
      });
      sandbox.stub(configFuncs, "supportChangeMfa").callsFake(() => {
        return true;
      });
      const allowedServicesModule = require("../../../middleware/check-allowed-services-list");
      sandbox
        .stub(allowedServicesModule, "hasAllowedRSAServices")
        .resolves(false);
      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        isPhoneNumberVerified: true,
      } as any;
      req.session.mfaMethods = [
        {
          mfaIdentifier: 1,
          priorityIdentifier: "DEFAULT",
          method: {
            mfaMethodType: "INVALID",
            PhoneNumber: "xxxxxxx7898",
          },
          methodVerified: true,
        },
      ] as any;

      expect(
        securityGet(req as Request, res as Response)
      ).to.eventually.be.rejectedWith("Unexpected mfaMethodType: INVALID");
    });

    it("should render security view with activity log when the user has a supported service and the feature flag is on", async () => {
      const configFuncs = require("../../../config");
      sandbox.stub(configFuncs, "supportActivityLog").callsFake(() => {
        return true;
      });
      sandbox.stub(configFuncs, "supportChangeMfa").callsFake(() => {
        return true;
      });
      sandbox.stub(configFuncs, "supportAddBackupMfa").callsFake(() => {
        return true;
      });

      const allowedServicesModule = require("../../../middleware/check-allowed-services-list");
      sandbox
        .stub(allowedServicesModule, "hasAllowedRSAServices")
        .resolves(true);
      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        isPhoneNumberVerified: true,
      } as any;
      req.session.mfaMethods = [
        {
          mfaIdentifier: 1,
          priorityIdentifier: "DEFAULT",
          method: {
            mfaMethodType: "SMS",
            PhoneNumber: "xxxxxxx7898",
          },
          methodVerified: true,
        },
      ] as any;

      await securityGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("security/index.njk", {
        email: "test@test.com",
        supportActivityLog: true,
        activityLogUrl: "/activity-history",
        enterPasswordUrl: "/enter-password?from=security",
        mfaMethods: [
          {
            text: "pages.security.mfaSection.supportChangeMfa.defaultMethod.phoneNumber.title",
            linkHref: "/enter-password?from=security&type=changePhoneNumber",
            linkText:
              "pages.security.mfaSection.supportChangeMfa.defaultMethod.phoneNumber.change",
            priorityIdentifier: "DEFAULT",
          },
        ],
        supportChangeMfa: true,
        supportAddBackupMfa: true,
        canChangeTypeofPrimary: true,
      });
    });
  });
});
