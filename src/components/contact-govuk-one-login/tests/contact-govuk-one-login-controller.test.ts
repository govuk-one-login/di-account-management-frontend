import { expect } from "chai";
import { describe } from "mocha";
import { Request, Response } from "express";
import { sinon } from "../../../../test/utils/test-utils";
import { contactGet } from "../contact-govuk-one-login-controller";
import { logger } from "../../../utils/logger";
import * as reference from "../../../utils/referenceCode";
import { I18NextRequest } from "i18next-http-middleware";

const CONTACT_ONE_LOGIN_TEMPLATE = "contact-govuk-one-login/index.njk";
const MOCK_REFERENCE_CODE = "123456";

describe("Contact GOV.UK One Login controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request> & Partial<I18NextRequest>;
  let res: Partial<Response>;
  let loggerSpy: sinon.SinonSpy;
  const baseUrl = "https://home.account.gov.uk";

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    loggerSpy = sinon.spy(logger, "info");

    req = {
      body: {},
      cookies: { lng: "en" },
      query: {},
      headers: { "user-agent": "user-agent" },
      session: {
        user: {
          isAuthenticated: true,
        },
      },
      protocol: "https",
      hostname: "home.account.gov.uk",
      originalUrl: baseUrl,
      language: "en",
      log: logger,
    };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(),
      locals: {},
      status: sandbox.fake(),
    };

    sandbox
      .stub(reference, "generateReferenceCode")
      .returns(MOCK_REFERENCE_CODE);

    process.env.SUPPORT_TRIAGE_PAGE = "1";
    process.env.SUPPORT_PHONE_CONTACT = "1";
    process.env.SHOW_CONTACT_GUIDANCE = "1";
    process.env.SUPPORT_WEBCHAT_CONTACT = "1";
    process.env.CONTACT_EMAIL_SERVICE_URL =
      "https://signin.account.gov.uk/contact-us";
    process.env.WEBCHAT_SOURCE_URL = "https://example.com";
  });

  afterEach(() => {
    sandbox.restore();
    loggerSpy.restore();
    delete process.env.SUPPORT_TRIAGE_PAGE;
    delete process.env.SUPPORT_PHONE_CONTACT;
    delete process.env.SHOW_CONTACT_GUIDANCE;
    delete process.env.SUPPORT_WEBCHAT_CONTACT;
    delete process.env.CONTACT_EMAIL_SERVICE_URL;
    delete process.env.WEBCHAT_SOURCE_URL;
  });

  describe("contactGet", () => {
    it("should render contact centre triage page", () => {
      const validUrl = "https://home.account.gov.uk/security";
      req.query.fromURL = validUrl;
      contactGet(req as Request, res as Response);
      // query data should be passed to the page render
      expect(res.render).to.have.calledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
        showContactGuidance: true,
        showSignOut: true,
        referenceCode: MOCK_REFERENCE_CODE,
        contactEmailServiceUrl:
          "https://signin.account.gov.uk/contact-us?fromURL=https%3A%2F%2Fhome.account.gov.uk%2Fsecurity",
        webchatSource: "https://example.com",
        currentUrl: baseUrl,
        baseUrl,
        language: "en",
      });
      // query data should be saved into session
      expect(req.session.fromURL).to.equal(validUrl);
    });

    it("should render contact centre triage page with fromURL from session and signedOut = false ", () => {
      const validUrl = "https://home.account.gov.uk/security";
      req.session = {
        fromURL: validUrl,
        user: {
          isAuthenticated: false,
        },
      };
      req.cookies = {
        ...req.cookies,
        lo: JSON.stringify({ user: null }),
      };
      contactGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
        showContactGuidance: true,
        showSignOut: false,
        referenceCode: MOCK_REFERENCE_CODE,
        contactEmailServiceUrl:
          "https://signin.account.gov.uk/contact-us?fromURL=https%3A%2F%2Fhome.account.gov.uk%2Fsecurity",
        webchatSource: "https://example.com",
        currentUrl: baseUrl,
        baseUrl,
        language: "en",
      });
    });

    it("should render contact centre triage page with additional fields from the mobile app", () => {
      const validUrl = "https://home.account.gov.uk/security";
      const appSessionId = "123456789";
      const appErrorCode = "ERRORCODE123";
      const theme = "WaveyTheme";
      req.query.fromURL = validUrl;
      req.query.appSessionId = appSessionId;
      req.query.appErrorCode = appErrorCode;
      req.query.theme = theme;
      contactGet(req as Request, res as Response);
      // query data should be passed to the page render
      expect(res.render).to.have.calledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactEmailServiceUrl:
          "https://signin.account.gov.uk/contact-us?fromURL=https%3A%2F%2Fhome.account.gov.uk%2Fsecurity&theme=WaveyTheme&appSessionId=123456789&appErrorCode=ERRORCODE123",
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
        showContactGuidance: true,
        showSignOut: true,
        referenceCode: MOCK_REFERENCE_CODE,
        webchatSource: "https://example.com",
        currentUrl: baseUrl,
        baseUrl,
        language: "en",
      });
      // query data should be saved into session
      expect(req.session.fromURL).to.equal(validUrl);
      expect(req.session.appSessionId).to.equal(appSessionId);
      expect(req.session.appErrorCode).to.equal(appErrorCode);
      expect(req.session.theme).to.equal(theme);
    });

    it("should render contact centre triage page with invalid fields from the mobile app", () => {
      const validUrl = "https://home.account.gov.uk/security";
      const appSessionId =
        "123456789123456789123456789123456789123456789123456789123456789123456789123456789"; // too long
      const appErrorCode = ";;***;;"; // unsafe characters
      req.query.fromURL = validUrl;
      req.query.appSessionId = appSessionId;
      req.query.appErrorCode = appErrorCode;
      contactGet(req as Request, res as Response);
      // invalid query data not should be passed to the page render
      expect(res.render).to.have.calledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactEmailServiceUrl:
          "https://signin.account.gov.uk/contact-us?fromURL=https%3A%2F%2Fhome.account.gov.uk%2Fsecurity",
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
        showContactGuidance: true,
        showSignOut: true,
        referenceCode: MOCK_REFERENCE_CODE,
        webchatSource: "https://example.com",
        currentUrl: baseUrl,
        baseUrl,
        language: "en",
      });
      // invalid query data should not be saved into session
      expect(req.session.fromURL).to.equal(validUrl);
      expect(req.session.appSessionId).to.be.undefined;
      expect(req.session.appErrorCode).to.be.undefined;
      expect(req.session.theme).to.be.undefined;
    });

    it("should render contact centre triage page with additional fields from the mobile app from session", () => {
      const validUrl = "https://home.account.gov.uk/security";
      const appSessionId = "123456789";
      const appErrorCode = "ERRORCODE123";
      const theme = "WaveyTheme";
      req.session.fromURL = validUrl;
      req.session.appSessionId = appSessionId;
      req.session.appErrorCode = appErrorCode;
      req.session.theme = theme;
      contactGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactEmailServiceUrl:
          "https://signin.account.gov.uk/contact-us?fromURL=https%3A%2F%2Fhome.account.gov.uk%2Fsecurity&theme=WaveyTheme&appSessionId=123456789&appErrorCode=ERRORCODE123",
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
        showContactGuidance: true,
        showSignOut: true,
        referenceCode: MOCK_REFERENCE_CODE,
        webchatSource: "https://example.com",
        currentUrl: baseUrl,
        baseUrl,
        language: "en",
      });
    });

    it("should render centre triage page when invalid fromURL is present", () => {
      const invalidUrl = "DROP * FROM *;";
      req.query.fromURL = invalidUrl;
      contactGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactEmailServiceUrl: "https://signin.account.gov.uk/contact-us",
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
        showContactGuidance: true,
        showSignOut: true,
        referenceCode: MOCK_REFERENCE_CODE,
        webchatSource: "https://example.com",
        currentUrl: baseUrl,
        baseUrl,
        language: "en",
      });
    });

    it("should render centre triage page when no fromURL is present", () => {
      contactGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactEmailServiceUrl: "https://signin.account.gov.uk/contact-us",
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
        showContactGuidance: true,
        showSignOut: true,
        referenceCode: MOCK_REFERENCE_CODE,
        webchatSource: "https://example.com",
        currentUrl: baseUrl,
        baseUrl,
        language: "en",
      });
    });

    it("should keep the reference code from the session if present", () => {
      req.session = {
        referenceCode: "654321",
        user: {
          isAuthenticated: true,
        },
      };
      contactGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
        showContactGuidance: true,
        showSignOut: true,
        referenceCode: "654321",
        contactEmailServiceUrl: "https://signin.account.gov.uk/contact-us",
        webchatSource: "https://example.com",
        currentUrl: baseUrl,
        baseUrl,
        language: "en",
      });
    });

    it("logs the reference code and request data", () => {
      const validUrl = "https://home.account.gov.uk/security";
      const appSessionId = "123456789";
      const appErrorCode = "ERRORCODE123";
      const theme = "WaveyTheme";
      const sessionId = "sessionId";
      const persistentSessionId = "persistentSessionId";

      req.query.fromURL = validUrl;
      req.query.appSessionId = appSessionId;
      req.query.appErrorCode = appErrorCode;
      req.query.theme = theme;
      req.session = {
        user: {
          isAuthenticated: true,
          sessionId,
          persistentSessionId,
        },
      };

      contactGet(req as Request, res as Response);

      expect(loggerSpy).to.have.calledWith(
        {
          fromURL: validUrl,
          referenceCode: MOCK_REFERENCE_CODE,
          appSessionId: appSessionId,
          appErrorCode: appErrorCode,
          sessionId: sessionId,
          persistentSessionId: persistentSessionId,
          userAgent: "user-agent",
        },
        "User visited triage page"
      );
    });
  });
});
