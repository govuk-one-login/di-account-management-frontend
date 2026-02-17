import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { contactGet } from "../contact-govuk-one-login-controller.js";
import { logger } from "../../../utils/logger.js";
import * as reference from "../../../utils/referenceCode.js";
import { SendMessageCommandOutput, SQSClient } from "@aws-sdk/client-sqs";
import { AuditEvent } from "../../../services/types";
import { MISSING_APP_SESSION_ID_SPECIAL_CASE } from "../../../app.constants";

const CONTACT_ONE_LOGIN_TEMPLATE = "contact-govuk-one-login/index.njk";
const MOCK_REFERENCE_CODE = "123456";
const MOCK_NONCE = "abcdef";

describe("Contact GOV.UK One Login controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let loggerSpy: ReturnType<typeof vi.fn>;
  let sqsClientStub: ReturnType<typeof vi.fn>;
  const baseUrl = "https://home.account.gov.uk";

  beforeEach(() => {
    loggerSpy = vi.spyOn(logger, "info");

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
        authorizationUrl: vi.fn(),
        metadata: { client_id: "test-client-id" } as any,
      } as any,
    };
    res = {
      render: vi.fn(),
      redirect: vi.fn(() => {}),
      locals: {
        sessionId: "sessionId",
        persistentSessionId: "persistentSessionId",
        scriptNonce: MOCK_NONCE,
        trace: "trace-id",
      },
      status: vi.fn(),
    };

    vi.spyOn(reference, "generateReferenceCode").mockReturnValue(
      MOCK_REFERENCE_CODE
    );

    process.env.SUPPORT_PHONE_CONTACT = "1";
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
    vi.restoreAllMocks();
    delete process.env.SUPPORT_PHONE_CONTACT;
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
      expect(res.render).toHaveBeenCalledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
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

    it("should render contact centre triage page with fromURL from session and signedOut = false", () => {
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
      expect(res.render).toHaveBeenCalledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
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
      expect(res.render).toHaveBeenCalledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactEmailServiceUrl: "/track-and-redirect",
        accessibilityStatementUrl:
          "https://signin.account.gov.uk/accessibility-statement",
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
        showContactEmergencyMessage: true,
        referenceCode: MOCK_REFERENCE_CODE,
        webchatSource: "https://example.com",
        baseUrl,
        language: "en",
        nonce: MOCK_NONCE,
      });
      // query data should be saved into session
      expect(req.session.queryParameters.fromURL).toBe(fromURL);
      expect(req.session.queryParameters.appSessionId).toBe(appSessionId);
      expect(req.session.queryParameters.appErrorCode).toBe(appErrorCode);
      expect(req.session.queryParameters.theme).toBe(theme);
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
      expect(res.render).toHaveBeenCalledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactEmailServiceUrl: "/track-and-redirect",
        accessibilityStatementUrl:
          "https://signin.account.gov.uk/accessibility-statement",
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
        showContactEmergencyMessage: true,
        referenceCode: MOCK_REFERENCE_CODE,
        webchatSource: "https://example.com",
        baseUrl,
        language: "en",
        nonce: MOCK_NONCE,
      });
      // invalid query data should not be saved into session
      expect(req.session.queryParameters.fromURL).toBe(validUrl);
      expect(req.session.queryParameters.appSessionId).toBeUndefined();
      expect(req.session.queryParameters.appErrorCode).toBeUndefined();
      expect(req.session.queryParameters.theme).toBeUndefined();
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
      expect(res.render).toHaveBeenCalledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactEmailServiceUrl: "/track-and-redirect",
        accessibilityStatementUrl:
          "https://signin.account.gov.uk/accessibility-statement",
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
        showContactEmergencyMessage: true,
        referenceCode: MOCK_REFERENCE_CODE,
        webchatSource: "https://example.com",
        baseUrl,
        language: "en",
        nonce: MOCK_NONCE,
      });
      expect(loggerSpy).toHaveBeenCalledWith(
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
      expect(res.render).toHaveBeenCalledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactEmailServiceUrl: "/track-and-redirect",
        accessibilityStatementUrl:
          "https://signin.account.gov.uk/accessibility-statement",
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
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
      expect(res.render).toHaveBeenCalledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
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
      expect(res.render).toHaveBeenCalledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        contactWebchatEnabled: true,
        contactPhoneEnabled: true,
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

      expect(loggerSpy).toHaveBeenCalledWith(
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

      sqsClientStub = vi.spyOn(SQSClient.prototype, "send");
      const sqsResponse: SendMessageCommandOutput = {
        $metadata: undefined,
        MessageId: "message-id",
        MD5OfMessageBody: "md5-hash",
      };
      process.env.AUDIT_QUEUE_URL = "queue";
      sqsClientStub.mockReturnValue(sqsResponse);

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
      expect(sqsClientStub).toHaveBeenCalled();
      const publishedEvent = JSON.parse(
        sqsClientStub.mock.calls[0][0].input.MessageBody
      ) as AuditEvent;
      expect(publishedEvent.event_name).toBe("HOME_TRIAGE_PAGE_VISIT");
      expect(typeof publishedEvent.timestamp).toBe("number");
      expect(publishedEvent.component_id).toBe("HOME");
      expect(publishedEvent.user.session_id).toBe(expectedSessionId);
      expect(publishedEvent.user.persistent_session_id).toBe(
        expectedPersistentSessionId
      );
      expect(publishedEvent.platform.user_agent).toBe("expectedUserAgent");
      expect(publishedEvent.extensions.app_error_code).toBe(
        expectedAppErrorCode
      );
      expect(publishedEvent.extensions.app_session_id).toBe(
        expectedAppSessionId
      );
      expect(publishedEvent.extensions.reference_code).toBe(
        expectedReferenceCode
      );
      expect(publishedEvent.extensions.from_url).toBe(expectedFromURL);
    });
  });
});
