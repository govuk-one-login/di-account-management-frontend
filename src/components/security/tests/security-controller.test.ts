import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { securityGet } from "../security-controller";

describe("security controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let configFuncs: any;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = { body: {}, session: { user: {} } as any, t: (k) => k };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      locals: {},
    };
    configFuncs = require("../../../config");
    sandbox.stub(configFuncs, "supportGlobalLogout").returns(false);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("securityGet", () => {
    it("should render security view with SMS MFA method", async () => {
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
        supportGlobalLogout: false,
        activityLogUrl: "/activity-history",
        enterPasswordUrl: "/enter-password?from=security&edit=true",
        mfaMethods: [
          {
            text: "pages.security.mfaSection.defaultMethod.phoneNumber.title",
            linkHref:
              "/enter-password?from=security&edit=true&type=changePhoneNumber",
            linkText:
              "pages.security.mfaSection.defaultMethod.phoneNumber.change",
            priorityIdentifier: "DEFAULT",
          },
        ],
        canChangeTypeofPrimary: true,
      });
    });

    it("throws an error when the mfaMethodType is undefined", async () => {
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

    it("should render security view with empty MFA methods when no MFA methods are set", async () => {
      req.session.user = { email: "test@test.com" } as any;
      req.session.mfaMethods = [];

      await securityGet(req as Request, res as Response);

      expect(res.render).to.have.been.calledWith("security/index.njk", {
        email: "test@test.com",
        supportGlobalLogout: false,
        activityLogUrl: "/activity-history",
        enterPasswordUrl: "/enter-password?from=security&edit=true",
        mfaMethods: [],
        canChangeTypeofPrimary: true,
      });
    });

    it("should render security view with AUTH_APP MFA method", async () => {
      req.session.user = { email: "test@test.com" } as any;
      req.session.mfaMethods = [
        {
          mfaIdentifier: 2,
          priorityIdentifier: "DEFAULT",
          method: {
            mfaMethodType: "AUTH_APP",
          },
          methodVerified: true,
        },
      ] as any;

      await securityGet(req as Request, res as Response);

      expect(res.render).to.have.been.calledWith("security/index.njk", {
        email: "test@test.com",
        supportGlobalLogout: false,
        activityLogUrl: "/activity-history",
        enterPasswordUrl: "/enter-password?from=security&edit=true",
        mfaMethods: [
          {
            text: "pages.security.mfaSection.defaultMethod.app.title",
            linkHref:
              "/enter-password?from=security&edit=true&type=changeAuthApp",
            linkText: "pages.security.mfaSection.defaultMethod.app.change",
            priorityIdentifier: "DEFAULT",
          },
        ],
        canChangeTypeofPrimary: true,
      });
    });

    it("should throw an error for an unsupported MFA method type", async () => {
      req.session.user = { email: "test@test.com" } as any;
      req.session.mfaMethods = [
        {
          mfaIdentifier: 1,
          priorityIdentifier: "DEFAULT",
          method: {
            mfaMethodType: "UNKNOWN",
            phoneNumber: "xxxxxxx7898",
          },
          methodVerified: true,
        },
      ] as any;

      await expect(
        securityGet(req as Request, res as Response)
      ).to.eventually.be.rejectedWith("Unexpected mfaMethodType: UNKNOWN");
    });

    it("should set canChangeTypeofPrimary to false when MFA constraints apply", async () => {
      req.session.user = { email: "test@test.com" } as any;
      req.session.mfaMethods = [
        {
          mfaIdentifier: "1",
          priorityIdentifier: "DEFAULT",
          method: { mfaMethodType: "SMS", phoneNumber: "0123456789" },
          methodVerified: true,
        },
        {
          mfaIdentifier: "2",
          priorityIdentifier: "BACKUP",
          method: { mfaMethodType: "AUTH_APP", credential: "abc123" },
          methodVerified: true,
        },
      ];

      await securityGet(req as Request, res as Response);

      expect(res.render).to.have.been.calledWithMatch("security/index.njk", {
        canChangeTypeofPrimary: false, // Should be false due to constraints
      });
    });
  });
});
