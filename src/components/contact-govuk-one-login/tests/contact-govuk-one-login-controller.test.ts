import { expect } from "chai";
import { describe } from "mocha";
import { Request, Response } from "express";
import { sinon } from "../../../../test/utils/test-utils";
import { contactGet } from "../contact-govuk-one-login-controller";
import { logger } from "../../../utils/logger";
import * as reference from "../../../utils/referenceCode";
import { SinonStub, stub } from "sinon";
import { SendMessageCommandOutput, SQSClient } from "@aws-sdk/client-sqs";
import { I18NextRequest } from "i18next-http-middleware";
import { AuditEvent } from "../../../services/types";
import { MISSING_APP_SESSION_ID_SPECIAL_CASE } from "../../../app.constants";

const CONTACT_ONE_LOGIN_TEMPLATE = "contact-govuk-one-login/index.njk";
const MOCK_REFERENCE_CODE = "123456";
const MOCK_NONCE = "abcdef";

describe("Contact GOV.UK One Login controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request> & Partial<I18NextRequest>;
  let res: Partial<Response>;
  let loggerSpy: sinon.SinonSpy;
  let sqsClientStub: SinonStub;
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
        queryParameters: {},
        user: {
          isAuthenticated: true,
        },
      } as any,
      protocol: "https",
      hostname: "home.account.gov.uk",
      originalUrl: baseUrl,
      language: "en",
      log: logger,
      oidc: {
        authorizationUrl: sinon.fake(),
        metadata: { client_id: "test-client-id" } as any,
      } as any,
    };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      locals: {
        sessionId: "sessionId",
        persistentSessionId: "persistentSessionId",
        scriptNonce: MOCK_NONCE,
        trace: "trace-id",
      },
      status: sandbox.fake(),
    };

    sandbox
      .stub(reference, "generateReferenceCode")
      .returns(MOCK_REFERENCE_CODE);

    process.env.SUPPORT_PHONE_CONTACT = "1";
    process.env.SHOW_CONTACT_GUIDANCE = "1";
    process.env.SHOW_CONTACT_EMERGENCY_MESSAGE = "1";
    process.env.SUPPORT_WEBCHAT_CONTACT = "1";
    process.env.CONTACT_EMAIL_SERVICE_URL =
      "https://signin.account.gov.uk/contact-us";
    process.env.ACCESSIBILITY_STATEMENT_URL =
      "https://signin.account.gov.uk/accessibility-statement";
    process.env.WEBCHAT_SOURCE_URL = "https://example.com";
    process.env.AUDIT_QUEUE_URL = "http://localhost:4566";
  });

  afterEach(() => {
    sandbox.restore();
    loggerSpy.restore();
    delete process.env.SUPPORT_PHONE_CONTACT;
    delete process.env.SHOW_CONTACT_GUIDANCE;
    delete process.env.SHOW_CONTACT_EMERGENCY_MESSAGE;
    delete process.env.SUPPORT_WEBCHAT_CONTACT;
    delete process.env.CONTACT_EMAIL_SERVICE_URL;
    delete process.env.WEBCHAT_SOURCE_URL;
    delete process.env.ACCESSIBILITY_STATEMENT_URL;
  });

  describe("contactGet", () => {
    it("should render contact centre triage page", () => {
      req.session = {
        referenceCode: MOCK_REFERENCE_CODE,
        user: {
          isAuthenticated: true,
        },
      } as any;
      req.query.fromURL = "https://home.account.gov.uk/security";
      contactGet(req as Request, res as Response);
      // query data should be passed to the page render
      expect(res.render).to.have.calledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
        showContactGuidance: true,
        showContactEmergencyMessage: true,
        referenceCode: MOCK_REFERENCE_CODE,
        contactEmailServiceUrl: "/track-and-redirect",
        accessibilityStatementUrl:
          "https://signin.account.gov.uk/accessibility-statement",
        webchatSource: "https://example.com",
        baseUrl,
        language: "en",
        nonce: MOCK_NONCE,
      });
    });

    it("should render contact centre triage page with fromURL from session and signedOut = false ", () => {
      const validUrl = "https://home.account.gov.uk/security";
      req.session = {
        referenceCode: MOCK_REFERENCE_CODE,
        queryParameters: {
          fromURL: validUrl,
        },
        user: {
          isAuthenticated: false,
        },
      } as any;
      req.cookies = {
        ...req.cookies,
        lo: JSON.stringify({ user: null }),
      };
      contactGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
        showContactGuidance: true,
        showContactEmergencyMessage: true,
        referenceCode: MOCK_REFERENCE_CODE,
        contactEmailServiceUrl: "/track-and-redirect",
        accessibilityStatementUrl:
          "https://signin.account.gov.uk/accessibility-statement",
        webchatSource: "https://example.com",
        baseUrl,
        language: "en",
        nonce: MOCK_NONCE,
      });
    });

    it("should render contact centre triage page with additional fields from the mobile app", () => {
      const fromURL = "https://home.account.gov.uk/security";
      const appSessionId = "123456789";
      const appErrorCode = "ERRORCODE123";
      const theme = "WaveyTheme";
      req.session = {
        referenceCode: MOCK_REFERENCE_CODE,
        queryParameters: {
          fromURL,
          appSessionId,
          appErrorCode,
          theme,
        },
        user: {
          isAuthenticated: true,
        },
      } as any;
      contactGet(req as Request, res as Response);
      // query data should be passed to the page render
      expect(res.render).to.have.calledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactEmailServiceUrl: "/track-and-redirect",
        accessibilityStatementUrl:
          "https://signin.account.gov.uk/accessibility-statement",
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
        showContactGuidance: true,
        showContactEmergencyMessage: true,
        referenceCode: MOCK_REFERENCE_CODE,
        webchatSource: "https://example.com",
        baseUrl,
        language: "en",
        nonce: MOCK_NONCE,
      });
      // query data should be saved into session
      expect(req.session.queryParameters.fromURL).to.equal(fromURL);
      expect(req.session.queryParameters.appSessionId).to.equal(appSessionId);
      expect(req.session.queryParameters.appErrorCode).to.equal(appErrorCode);
      expect(req.session.queryParameters.theme).to.equal(theme);
    });

    it("should render contact centre triage page ignoring invalid fields from the mobile app", () => {
      const validUrl = "https://home.account.gov.uk/security";
      const appSessionId =
        "123456789123456789123456789123456789123456789123456789123456789123456789123456789"; // too long
      const appErrorCode = ";;***;;"; // unsafe characters
      req.query.fromURL = validUrl;
      req.query.appSessionId = appSessionId;
      req.query.appErrorCode = appErrorCode;
      req.session = {
        referenceCode: MOCK_REFERENCE_CODE,
        queryParameters: {
          fromURL: validUrl,
        },
        user: {
          isAuthenticated: true,
        },
      } as any;
      contactGet(req as Request, res as Response);
      // invalid query data not should be passed to the page render
      expect(res.render).to.have.calledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactEmailServiceUrl: "/track-and-redirect",
        accessibilityStatementUrl:
          "https://signin.account.gov.uk/accessibility-statement",
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
        showContactGuidance: true,
        showContactEmergencyMessage: true,
        referenceCode: MOCK_REFERENCE_CODE,
        webchatSource: "https://example.com",
        baseUrl,
        language: "en",
        nonce: MOCK_NONCE,
      });
      // invalid query data should not be saved into session
      expect(req.session.queryParameters.fromURL).to.equal(validUrl);
      expect(req.session.queryParameters.appSessionId).to.be.undefined;
      expect(req.session.queryParameters.appErrorCode).to.be.undefined;
      expect(req.session.queryParameters.theme).to.be.undefined;
    });

    it("should render centre triage page when invalid fromURL is present", () => {
      req.session = {
        referenceCode: MOCK_REFERENCE_CODE,
        queryParameters: {
          fromURL: undefined,
        },
        user: {
          isAuthenticated: true,
        },
      } as any;
      contactGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactEmailServiceUrl: "/track-and-redirect",
        accessibilityStatementUrl:
          "https://signin.account.gov.uk/accessibility-statement",
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
        showContactGuidance: true,
        showContactEmergencyMessage: true,
        referenceCode: MOCK_REFERENCE_CODE,
        webchatSource: "https://example.com",
        baseUrl,
        language: "en",
        nonce: MOCK_NONCE,
      });
      expect(loggerSpy).to.have.calledWith(
        {
          trace: res.locals.trace,
          fromURL: undefined,
          referenceCode: "123456",
          appSessionId: MISSING_APP_SESSION_ID_SPECIAL_CASE,
          appErrorCode: undefined,
          sessionId: "sessionId",
          persistentSessionId: "persistentSessionId",
          userAgent: "user-agent",
        },
        "User visited triage page"
      );
    });

    it("should render centre triage page when no fromURL is present", () => {
      req.session = {
        referenceCode: "123456",
        user: {
          isAuthenticated: true,
        },
      } as any;
      contactGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactEmailServiceUrl: "/track-and-redirect",
        accessibilityStatementUrl:
          "https://signin.account.gov.uk/accessibility-statement",
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
        showContactGuidance: true,
        showContactEmergencyMessage: true,
        referenceCode: MOCK_REFERENCE_CODE,
        webchatSource: "https://example.com",
        baseUrl,
        language: "en",
        nonce: MOCK_NONCE,
      });
    });

    it("should keep the reference code from the session if present", () => {
      req.session = {
        referenceCode: "654321",
        user: {
          isAuthenticated: true,
        },
      } as any;
      contactGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
        showContactGuidance: true,
        showContactEmergencyMessage: true,
        referenceCode: "654321",
        contactEmailServiceUrl: "/track-and-redirect",
        accessibilityStatementUrl:
          "https://signin.account.gov.uk/accessibility-statement",
        webchatSource: "https://example.com",
        baseUrl,
        language: "en",
        nonce: MOCK_NONCE,
      });
    });

    it("should render the contact page when a user is logged out", () => {
      req.session = {
        referenceCode: "654321",
        user: {
          isAuthenticated: true,
        },
      } as any;
      req.cookies.lo = "true";
      contactGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
        showContactGuidance: true,
        showContactEmergencyMessage: true,
        referenceCode: "654321",
        contactEmailServiceUrl: "/track-and-redirect",
        accessibilityStatementUrl:
          "https://signin.account.gov.uk/accessibility-statement",
        webchatSource: "https://example.com",
        baseUrl,
        language: "en",
        nonce: MOCK_NONCE,
      });
    });

    it("logs the reference code and request data", () => {
      const fromURL = "https://home.account.gov.uk/security";
      const appSessionId = "123456789";
      const appErrorCode = "ERRORCODE123";
      const theme = "WaveyTheme";
      const sessionId = "sessionId";
      const persistentSessionId = "persistentSessionId";

      req.session = {
        referenceCode: MOCK_REFERENCE_CODE,
        queryParameters: {
          fromURL,
          appSessionId,
          appErrorCode,
          theme,
        },
        user: {
          isAuthenticated: true,
          sessionId,
          persistentSessionId,
        },
      } as any;

      contactGet(req as Request, res as Response);

      expect(loggerSpy).to.have.calledWith(
        {
          trace: res.locals.trace,
          fromURL,
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
      const expectedAppErrorCode = "app-error-code";
      const expectedAppSessionId = "app-session-id";
      const expectedReferenceCode = "reference-code";
      const expectedFromURL = "https://gov.uk/ogd";
      const expectedUserAgent = "expectedUserAgent";

      sqsClientStub = stub(SQSClient.prototype, "send");
      const sqsResponse: SendMessageCommandOutput = {
        $metadata: undefined,
        MessageId: "message-id",
        MD5OfMessageBody: "md5-hash",
      };
      process.env.AUDIT_QUEUE_URL = "queue";
      sqsClientStub.returns(sqsResponse);

      req.session = {
        user: {
          isAuthenticated: true,
          sessionId: expectedSessionId,
          persistentSessionId: expectedPersistentSessionId,
        },
        queryParameters: {
          fromURL: expectedFromURL,
          appErrorCode: expectedAppErrorCode,
          appSessionId: expectedAppSessionId,
        },
        referenceCode: expectedReferenceCode,
      } as any;

      req.query.fromURL = expectedFromURL;
      req.query.appErrorCode = expectedAppErrorCode;
      req.query.appSessionId = expectedAppSessionId;
      req.headers["user-agent"] = expectedUserAgent;

      res.locals.sessionId = expectedSessionId;
      res.locals.persistent_session_id = expectedPersistentSessionId;

      // Act
      contactGet(req as Request, res as Response);

      // Assert
      expect(sqsClientStub.called).to.eq(true);
      const publishedEvent = JSON.parse(
        sqsClientStub.getCall(0).firstArg.input.MessageBody
      ) as AuditEvent;
      expect(publishedEvent.event_name).to.equal("HOME_TRIAGE_PAGE_VISIT");
      expect(publishedEvent.timestamp).to.be.a("number");
      expect(publishedEvent.component_id).to.equal("HOME");
      expect(publishedEvent.user.session_id).to.equal(expectedSessionId);
      expect(publishedEvent.user.persistent_session_id).to.equal(
        expectedPersistentSessionId
      );
      expect(publishedEvent.platform.user_agent).to.equal("expectedUserAgent");
      expect(publishedEvent.extensions.app_error_code).to.equal(
        expectedAppErrorCode
      );
      expect(publishedEvent.extensions.app_session_id).to.equal(
        expectedAppSessionId
      );
      expect(publishedEvent.extensions.reference_code).to.equal(
        expectedReferenceCode
      );
      expect(publishedEvent.extensions.from_url).to.equal(expectedFromURL);

      // Tidy up
      sqsClientStub.restore();
    });
  });
});
