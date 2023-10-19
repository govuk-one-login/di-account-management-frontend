import { expect } from "chai";
import { describe } from "mocha";
import { Request, Response } from "express";
import { sinon } from "../../../../test/utils/test-utils";
import { contactGet } from "../contact-govuk-one-login-controller";
import { logger } from "../../../utils/logger";
import * as reference from "../../../utils/referenceCode";
import { AuditEvent } from "../types";

const CONTACT_ONE_LOGIN_TEMPLATE = "contact-govuk-one-login/index.njk";
const MOCK_REFERENCE_CODE = "123456";

describe("Contact GOV.UK One Login controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let loggerSpy: sinon.SinonSpy;

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
      });
      // query data should be saved into session
      expect(req.session.fromURL).to.equal(validUrl);
      expect(req.session.appSessionId).to.equal(appSessionId);
      expect(req.session.appErrorCode).to.equal(appErrorCode);
      expect(req.session.theme).to.equal(theme);
    });

    it("should render contact centre triage page ignoring invalid fields from the mobile app", () => {
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
      });
      expect(loggerSpy).to.have.calledWith(
        "Request to contact-govuk-one-login page did not contain a valid fromURL in the request or session"
      );
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
      });
    });

    it("should render the contact page when a user is logged out", () => {
      req.session = {
        referenceCode: "654321",
        user: {
          isAuthenticated: true,
        },
      };
      req.cookies.lo = 'true';
      contactGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
        showContactGuidance: true,
        showSignOut: false,
        referenceCode: "654321",
        contactEmailServiceUrl: "https://signin.account.gov.uk/contact-us",
        webchatSource: "https://example.com",
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

    it("emits an audit event when the user visits the contact page", () => {
      // Arrange
      const expectedSessionId = "sessionId";
      const expectedPersistentSessionId = "persistentSessionId";
      const expectedTimestamp = 1111;
      const expectedUserAgent = "user-agent";

      req.session = {
        user: {
          isAuthenticated: true,
          sessionId: expectedSessionId,
          persistentSessionId: expectedPersistentSessionId,
        },
        timestamp: expectedTimestamp,
        fromURL: "fromUrl",
        appErrorCode: "app-error-code",
        appSessionId: "app-session-id",
        referenceCode: "reference-code",
      };

      req.query.fromURL = 'https://gov.uk/ogd';
      req.query.appErrorCode = "app-error-code";
      req.query.appSessionId = "app-session-id";

      const expectedAuditEvent: AuditEvent = {
        timestamp: expectedTimestamp,
        event_name: "HOME_TRIAGE_PAGE_VISIT",
        component_id: "HOME",
        user: {
          session_id: expectedSessionId,
          persistent_session_id: expectedPersistentSessionId,
        },
        platform: {
          user_agent: expectedUserAgent
        },
        extensions: {
          from_url: "https://gov.uk/ogd",
          app_error_code: "app-error-code",
          app_session_id: "app-session-id",
          reference_code: "reference-code",
        },
      }

      // Act
      contactGet(req as Request, res as Response);

      // Assert
      expect(loggerSpy).to.have.calledWith(
        {
          Event: expectedAuditEvent,
        },
        "will use the SQSClient to send an audit event"
      )
    })


  });
});
