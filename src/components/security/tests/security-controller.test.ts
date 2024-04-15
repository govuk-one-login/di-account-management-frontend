import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { securityGet } from "../security-controller";

import { Logger } from "pino";
import { Client } from "openid-client";
import {
  CURRENT_EMAIL,
  ENGLISH,
  NEW_EMAIL,
  ORIGINAL_URL,
  RequestBuilder,
} from "../../../../test/utils/builders";

declare module "express-serve-static-core" {
  interface Request {
    i18n?: {
      language?: string;
    };
    language?: string;
    t?: (arg0: string) => string;
    csrfToken?: () => string;
    oidc?: Client;
    issuerJWKS?: any;
    log: Logger;
  }
}

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
      const allowedServicesModule = require("../../../middleware/check-allowed-services-list");
      sandbox
        .stub(allowedServicesModule, "hasAllowedRSAServices")
        .resolves(true);

      req = new RequestBuilder().withBody({ email: NEW_EMAIL }).build();

      await securityGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("security/index.njk", {
        email: CURRENT_EMAIL,
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
        showAdditionalMethodUpsell: true,
        language: ENGLISH,
        currentUrl: ORIGINAL_URL,
        baseUrl: "https://www.gov.uk",
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
      const allowedServicesModule = require("../../../middleware/check-allowed-services-list");
      sandbox.stub(allowedServicesModule, "hasHmrcService").resolves(true);

      req = new RequestBuilder().withBody({ email: NEW_EMAIL }).build();

      await securityGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("security/index.njk", {
        email: CURRENT_EMAIL,
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
        showAdditionalMethodUpsell: true,
        language: ENGLISH,
        currentUrl: ORIGINAL_URL,
        baseUrl: "https://www.gov.uk",
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
      const allowedServicesModule = require("../../../middleware/check-allowed-services-list");
      sandbox
        .stub(allowedServicesModule, "hasAllowedRSAServices")
        .resolves(false);

      req = new RequestBuilder().withBody({ email: NEW_EMAIL }).build();

      await securityGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("security/index.njk", {
        email: CURRENT_EMAIL,
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
        showAdditionalMethodUpsell: true,
        language: ENGLISH,
        currentUrl: ORIGINAL_URL,
        baseUrl: "https://www.gov.uk",
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
          priorityIdentifier: "PRIMARY",
          endPoint: "xxxxxxx7898",
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
          priorityIdentifier: "PRIMARY",
          mfaMethodType: "INVALID",
          endPoint: "xxxxxxx7898",
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

      const allowedServicesModule = require("../../../middleware/check-allowed-services-list");
      sandbox
        .stub(allowedServicesModule, "hasAllowedRSAServices")
        .resolves(true);

      req = new RequestBuilder().withBody({ email: NEW_EMAIL }).build();

      await securityGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("security/index.njk", {
        email: CURRENT_EMAIL,
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
        showAdditionalMethodUpsell: true,
        language: ENGLISH,
        currentUrl: ORIGINAL_URL,
        baseUrl: "https://www.gov.uk",
      });
    });
  });
});
