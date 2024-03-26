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
          priorityIdentifier: "PRIMARY",
          mfaMethodType: "SMS",
          endPoint: "xxxxxxx7898",
          methodVerified: true,
        },
      ] as any;

      await securityGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("security/index.njk", {
        email: "test@test.com",
        supportActivityLog: true,
        activityLogUrl: "/activity-history",
        mfaMethods: [
          {
            classes: "govuk-summary-list__row--no-border",
            key: {
              text: "pages.security.mfaSection.summaryList.phoneNumber.title",
            },
            value: {
              text: "pages.security.mfaSection.summaryList.phoneNumber.value",
            },
            actions: {
              items: [
                {
                  attributes: { "data-test-id": "change-phone-number" },
                  href: "/enter-password?type=changePhoneNumber",
                  text: "general.change",
                  visuallyHiddenText:
                    "pages.security.mfaSection.summaryList.app.hiddenText",
                },
              ],
            },
          },
        ],
      });
    });
    it("should render security view without activity log when the feature flag is off", async () => {
      const configFuncs = require("../../../config");
      sandbox.stub(configFuncs, "supportActivityLog").callsFake(() => {
        return false;
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
          priorityIdentifier: "PRIMARY",
          mfaMethodType: "SMS",
          endPoint: "xxxxxxx7898",
          methodVerified: true,
        },
      ] as any;

      await securityGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("security/index.njk", {
        email: "test@test.com",
        supportActivityLog: false,
        activityLogUrl: "/activity-history",
        mfaMethods: [
          {
            classes: "govuk-summary-list__row--no-border",
            key: {
              text: "pages.security.mfaSection.summaryList.phoneNumber.title",
            },
            value: {
              text: "pages.security.mfaSection.summaryList.phoneNumber.value",
            },
            actions: {
              items: [
                {
                  attributes: { "data-test-id": "change-phone-number" },
                  href: "/enter-password?type=changePhoneNumber",
                  text: "general.change",
                  visuallyHiddenText:
                    "pages.security.mfaSection.summaryList.app.hiddenText",
                },
              ],
            },
          },
        ],
      });
    });
    it("should render security view without activity log when the user doesn't have a supported service", async () => {
      const configFuncs = require("../../../config");
      sandbox.stub(configFuncs, "supportActivityLog").callsFake(() => {
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
          priorityIdentifier: "PRIMARY",
          mfaMethodType: "SMS",
          endPoint: "xxxxxxx7898",
          methodVerified: true,
        },
      ] as any;

      await securityGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("security/index.njk", {
        email: "test@test.com",
        supportActivityLog: false,
        activityLogUrl: "/activity-history",
        mfaMethods: [
          {
            classes: "govuk-summary-list__row--no-border",
            key: {
              text: "pages.security.mfaSection.summaryList.phoneNumber.title",
            },
            value: {
              text: "pages.security.mfaSection.summaryList.phoneNumber.value",
            },
            actions: {
              items: [
                {
                  attributes: { "data-test-id": "change-phone-number" },
                  href: "/enter-password?type=changePhoneNumber",
                  text: "general.change",
                  visuallyHiddenText:
                    "pages.security.mfaSection.summaryList.app.hiddenText",
                },
              ],
            },
          },
        ],
      });
    });
    it("should render security view with activity log when the user has a supported service and the feature flag is on", async () => {
      const configFuncs = require("../../../config");
      sandbox.stub(configFuncs, "supportActivityLog").callsFake(() => {
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
          priorityIdentifier: "PRIMARY",
          mfaMethodType: "SMS",
          endPoint: "xxxxxxx7898",
          methodVerified: true,
        },
      ] as any;

      await securityGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("security/index.njk", {
        email: "test@test.com",
        supportActivityLog: true,
        activityLogUrl: "/activity-history",
        mfaMethods: [
          {
            classes: "govuk-summary-list__row--no-border",
            key: {
              text: "pages.security.mfaSection.summaryList.phoneNumber.title",
            },
            value: {
              text: "pages.security.mfaSection.summaryList.phoneNumber.value",
            },
            actions: {
              items: [
                {
                  attributes: { "data-test-id": "change-phone-number" },
                  href: "/enter-password?type=changePhoneNumber",
                  text: "general.change",
                  visuallyHiddenText:
                    "pages.security.mfaSection.summaryList.app.hiddenText",
                },
              ],
            },
          },
        ],
      });
    });
  });
});
