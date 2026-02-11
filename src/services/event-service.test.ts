import { expect, vi, describe, it, beforeEach, afterEach } from "vitest";
import { SqsService } from "../utils/types.js";
import { eventService } from "./event-service.js";
import {
  EventName,
  MISSING_APP_SESSION_ID_SPECIAL_CASE,
  MISSING_PERSISTENT_SESSION_ID_SPECIAL_CASE,
  MISSING_SESSION_ID_SPECIAL_CASE,
  MISSING_USER_ID_SPECIAL_CASE,
} from "../app.constants.js";

describe("eventService", () => {
  let sqs: SqsService;
  let sendSpy: ReturnType<typeof vi.fn>;
  let originalClientId: string;

  beforeEach(() => {
    sendSpy = vi.fn();
    sqs = { sendAuditEvent: sendSpy } as any;

    originalClientId = process.env.OIDC_CLIENT_ID;
    process.env.OIDC_CLIENT_ID = "test-client-id";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.OIDC_CLIENT_ID = originalClientId;
  });

  describe("buildAuditEvent", () => {
    let clock: ReturnType<typeof vi.useFakeTimers>;

    beforeEach(() => {
      clock = vi.useFakeTimers();
      clock.setSystemTime(new Date(Date.UTC(2023, 20, 12)));
    });

    afterEach(() => {
      clock.restoreAllMocks();
    });

    it("should build a HOME_TRIAGE_PAGE_EMAIL audit event correctly", () => {
      const service = eventService(sqs);

      const mockReq: any = {
        headers: {
          "user-agent": "test-user-agent",
          "txma-audit-encoded": btoa("test-txma-header"),
        },
        ip: "127.0.0.1",
        session: {
          queryParameters: {
            fromURL: "test-from-url",
            appErrorCode: "test-error-code",
            appSessionId: "test-app-session-id",
          },
          referenceCode: "test-reference-code",
          user_id: "test-user-id",
          user: {
            isAuthenticated: true,
            email: "test@example.com",
          },
        },
      };

      const mockRes: any = {
        locals: {
          sessionId: "test-session-id",
          persistentSessionId: "test-persistent-session-id",
          clientSessionId: "test-client-session-id",
        },
      };

      const result = service.buildAuditEvent(
        mockReq,
        mockRes,
        EventName.HOME_TRIAGE_PAGE_EMAIL
      );

      expect(result.component_id).toBe("HOME");
      expect(result.event_name).toBe("HOME_TRIAGE_PAGE_EMAIL");
      expect(result.user.session_id).toBe("test-session-id");
      expect(result.user.persistent_session_id).toBe(
        "test-persistent-session-id"
      );
      expect(result.user.user_id).toBe("test-user-id");
      expect(result.user.email).toBe("test@example.com");
      expect(result.user.ip_address).toBe("127.0.0.1");
      expect(result.user.govuk_signin_journey_id).toBe(
        "test-client-session-id"
      );
      expect(result.platform.user_agent).toBe("test-user-agent");
      expect(result.extensions.from_url).toBe("test-from-url");
      expect(result.extensions.app_error_code).toBe("test-error-code");
      expect(result.extensions.app_session_id).toBe("test-app-session-id");
      expect(result.extensions.reference_code).toBe("test-reference-code");
      expect(result.extensions.is_signed_in).toBe(true);
      expect(result.event_timestamp_ms).toBe(1726099200000);
      expect(result.event_timestamp_ms_formatted).toBe(
        "2024-09-12T00:00:00.000Z"
      );
      expect(result.timestamp).toBe(1726099200);
      expect(atob(result.restricted.device_information.encoded)).toBe(
        "test-txma-header"
      );
    });

    it("should handle missing IDs", () => {
      const service = eventService(sqs);

      const mockReq: any = {
        headers: {},
        session: {},
      };

      const mockRes: any = {
        locals: {},
      };

      const result = service.buildAuditEvent(
        mockReq,
        mockRes,
        EventName.HOME_TRIAGE_PAGE_EMAIL
      );

      expect(result.user.session_id).toBe(MISSING_SESSION_ID_SPECIAL_CASE);
      expect(result.user.persistent_session_id).toBe(
        MISSING_PERSISTENT_SESSION_ID_SPECIAL_CASE
      );
      expect(result.user.user_id).toBe(MISSING_USER_ID_SPECIAL_CASE);
      expect(result.extensions.app_session_id).toBe(
        MISSING_APP_SESSION_ID_SPECIAL_CASE
      );
    });

    it("should handle missing queryParameters", () => {
      const service = eventService(sqs);

      const mockReq: any = {
        headers: {},
        session: {
          referenceCode: "test-reference-code",
        },
      };

      const mockRes: any = {
        locals: {
          sessionId: "test-session-id",
          persistentSessionId: "test-persistent-session-id",
        },
      };

      const result = service.buildAuditEvent(
        mockReq,
        mockRes,
        EventName.HOME_TRIAGE_PAGE_EMAIL
      );

      expect(result.extensions.from_url).toBeUndefined();
      expect(result.extensions.app_error_code).toBeUndefined();
      expect(result.extensions.app_session_id).toBe(
        MISSING_APP_SESSION_ID_SPECIAL_CASE
      );
      expect(result.restricted).toBeUndefined();
    });

    it("should build a HOME_TRIAGE_PAGE_VISIT event correctly", () => {
      const service = eventService(sqs);

      const mockReq: any = {
        headers: {
          "user-agent": "test-user-agent",
          "txma-audit-encoded": btoa("test-txma-header"),
        },
        ip: "127.0.0.1",
        session: {
          queryParameters: {
            fromURL: "test-from-url",
            appErrorCode: "test-error-code",
            appSessionId: "test-app-session-id",
          },
          referenceCode: "test-reference-code",
          user_id: "test-user-id",
          user: {
            isAuthenticated: true,
            email: "test@example.com",
          },
        },
      };

      const mockRes: any = {
        locals: {
          sessionId: "test-session-id",
          persistentSessionId: "test-persistent-session-id",
          clientSessionId: "test-client-session-id",
        },
      };

      const result = service.buildAuditEvent(
        mockReq,
        mockRes,
        EventName.HOME_TRIAGE_PAGE_VISIT
      );

      expect(result.component_id).toBe("HOME");
      expect(result.event_name).toBe("HOME_TRIAGE_PAGE_VISIT");
      expect(result.user.session_id).toBe("test-session-id");
      expect(result.user.persistent_session_id).toBe(
        "test-persistent-session-id"
      );
      expect(result.user.user_id).toBe("test-user-id");
      expect(result.user.email).toBe("test@example.com");
      expect(result.user.ip_address).toBe("127.0.0.1");
      expect(result.user.govuk_signin_journey_id).toBe(
        "test-client-session-id"
      );
      expect(result.platform.user_agent).toBe("test-user-agent");
      expect(result.extensions.from_url).toBe("test-from-url");
      expect(result.extensions.app_error_code).toBe("test-error-code");
      expect(result.extensions.app_session_id).toBe("test-app-session-id");
      expect(result.extensions.reference_code).toBe("test-reference-code");
      expect(result.extensions.is_signed_in).toBe(true);
      expect(result.event_timestamp_ms).toBe(1726099200000);
      expect(result.event_timestamp_ms_formatted).toBe(
        "2024-09-12T00:00:00.000Z"
      );
      expect(result.timestamp).toBe(1726099200);
      expect(atob(result.restricted.device_information.encoded)).toBe(
        "test-txma-header"
      );
    });

    it("should build an AUTH_MFA_METHOD_ADD_STARTED event correctly", () => {
      const service = eventService(sqs);

      const mockReq: any = {
        headers: {
          "user-agent": "test-user-agent",
          "txma-audit-encoded": btoa("test-txma-header"),
        },
        ip: "127.0.0.1",
        session: {
          user_id: "test-user-id",
          user: {
            isAuthenticated: true,
            email: "test@example.com",
          },
          mfaMethods: [
            {
              mfaIdentifier: "1234",
              methodVerified: true,
              method: {
                mfaMethodType: "SMS",
                phoneNumber: "+447123456789",
              },
              priorityIdentifier: "DEFAULT",
            },
          ],
        },
      };

      const mockRes: any = {
        locals: {
          sessionId: "test-session-id",
          persistentSessionId: "test-persistent-session-id",
          clientSessionId: "test-client-session-id",
        },
      };

      const result = service.buildAuditEvent(
        mockReq,
        mockRes,
        EventName.AUTH_MFA_METHOD_ADD_STARTED
      );

      expect(result.component_id).toBe("HOME");
      expect(result.event_name).toBe("AUTH_MFA_METHOD_ADD_STARTED");
      expect(result.user.session_id).toBe("test-session-id");
      expect(result.user.persistent_session_id).toBe(
        "test-persistent-session-id"
      );
      expect(result.user.user_id).toBe("test-user-id");
      expect(result.user.email).toBe("test@example.com");
      expect(result.user.ip_address).toBe("127.0.0.1");
      expect(result.user.govuk_signin_journey_id).toBe(
        "test-client-session-id"
      );
      expect(result.platform.user_agent).toBe("test-user-agent");
      expect(result.extensions["journey-type"]).toBe("ACCOUNT_MANAGEMENT");
      expect(result.extensions.phone_number_country_code).toBe("44");
      expect(result.user.phone).toBe("+447123456789");
      expect(result.event_timestamp_ms).toBe(1726099200000);
      expect(result.event_timestamp_ms_formatted).toBe(
        "2024-09-12T00:00:00.000Z"
      );
      expect(result.timestamp).toBe(1726099200);
      expect(atob(result.restricted.device_information.encoded)).toBe(
        "test-txma-header"
      );
    });

    it("should build an AUTH_MFA_METHOD_SWITCH_STARTED event correctly", () => {
      const service = eventService(sqs);

      const mockReq: any = {
        headers: {
          "user-agent": "test-user-agent",
          "txma-audit-encoded": btoa("test-txma-header"),
        },
        ip: "127.0.0.1",
        session: {
          user_id: "test-user-id",
          user: {
            isAuthenticated: true,
            email: "test@example.com",
          },
          mfaMethods: [
            {
              mfaIdentifier: "1234",
              methodVerified: true,
              method: {
                mfaMethodType: "SMS",
                phoneNumber: "+447123456789",
              },
              priorityIdentifier: "DEFAULT",
            },
            {
              mfaIdentifier: "5678",
              methodVerified: true,
              method: {
                mfaMethodType: "AUTH_APP",
              },
              priorityIdentifier: "BACKUP",
            },
          ],
        },
      };

      const mockRes: any = {
        locals: {
          sessionId: "test-session-id",
          persistentSessionId: "test-persistent-session-id",
          clientSessionId: "test-client-session-id",
        },
      };

      const result = service.buildAuditEvent(
        mockReq,
        mockRes,
        EventName.AUTH_MFA_METHOD_SWITCH_STARTED
      );

      expect(result.component_id).toBe("HOME");
      expect(result.event_name).toBe("AUTH_MFA_METHOD_SWITCH_STARTED");
      expect(result.user.session_id).toBe("test-session-id");
      expect(result.user.persistent_session_id).toBe(
        "test-persistent-session-id"
      );
      expect(result.user.user_id).toBe("test-user-id");
      expect(result.user.email).toBe("test@example.com");
      expect(result.user.ip_address).toBe("127.0.0.1");
      expect(result.user.govuk_signin_journey_id).toBe(
        "test-client-session-id"
      );
      expect(result.platform.user_agent).toBe("test-user-agent");
      expect(result.extensions["journey-type"]).toBe("ACCOUNT_MANAGEMENT");
      expect(result.extensions["mfa-type"]).toBe("SMS");
      expect(result.extensions.phone_number_country_code).toBe("44");
      expect(result.user.phone).toBe("+447123456789");
      expect(result.event_timestamp_ms).toBe(1726099200000);
      expect(result.event_timestamp_ms_formatted).toBe(
        "2024-09-12T00:00:00.000Z"
      );
      expect(result.timestamp).toBe(1726099200);
      expect(atob(result.restricted.device_information.encoded)).toBe(
        "test-txma-header"
      );
    });

    it("should build an HOME_GLOBAL_LOGOUT_REQUESTED event correctly", () => {
      const service = eventService(sqs);
      const mockReq: any = {
        headers: {
          "user-agent": "test-user-agent",
          "txma-audit-encoded": btoa("test-txma-header"),
        },
        session: {
          user_id: "test-user-id",
          user: {
            isAuthenticated: true,
          },
        },
      };
      const mockRes: any = {
        locals: {
          sessionId: "test-session-id",
          persistentSessionId: "test-persistent-session-id",
        },
      };
      const result = service.buildAuditEvent(
        mockReq,
        mockRes,
        EventName.HOME_GLOBAL_LOGOUT_REQUESTED
      );
      expect(result.component_id).toBe("HOME");
      expect(result.event_name).toBe("HOME_GLOBAL_LOGOUT_REQUESTED");
      expect(result.user.session_id).toBe("test-session-id");
      expect(result.user.persistent_session_id).toBe(
        "test-persistent-session-id"
      );
      expect(result.user.user_id).toBe("test-user-id");
      expect(result.platform.user_agent).toBe("test-user-agent");
      expect(result.client_id).toBe("test-client-id");
      expect(result.event_timestamp_ms).toBe(1726099200000);
      expect(result.event_timestamp_ms_formatted).toBe(
        "2024-09-12T00:00:00.000Z"
      );
      expect(result.timestamp).toBe(1726099200);
      expect(atob(result.restricted.device_information.encoded)).toBe(
        "test-txma-header"
      );
    });

    it("should build an AUTH_MFA_METHOD_DELETE_STARTED event correctly", () => {
      const service = eventService(sqs);

      const mockReq: any = {
        headers: {
          "user-agent": "test-user-agent",
          "txma-audit-encoded": btoa("test-txma-header"),
        },
        ip: "127.0.0.1",
        session: {
          user_id: "test-user-id",
          user: {
            isAuthenticated: true,
            email: "test@example.com",
          },
          mfaMethods: [
            {
              mfaIdentifier: "1234",
              methodVerified: true,
              method: {
                mfaMethodType: "SMS",
                phoneNumber: "+447123456789",
              },
              priorityIdentifier: "DEFAULT",
            },
            {
              mfaIdentifier: "5678",
              methodVerified: true,
              method: {
                mfaMethodType: "SMS",
                phoneNumber: "+447987654321",
              },
              priorityIdentifier: "BACKUP",
            },
          ],
        },
      };

      const mockRes: any = {
        locals: {
          sessionId: "test-session-id",
          persistentSessionId: "test-persistent-session-id",
          clientSessionId: "test-client-session-id",
        },
      };

      const result = service.buildAuditEvent(
        mockReq,
        mockRes,
        EventName.AUTH_MFA_METHOD_DELETE_STARTED
      );

      expect(result.component_id).toBe("HOME");
      expect(result.event_name).toBe("AUTH_MFA_METHOD_DELETE_STARTED");
      expect(result.user.session_id).toBe("test-session-id");
      expect(result.user.persistent_session_id).toBe(
        "test-persistent-session-id"
      );
      expect(result.user.user_id).toBe("test-user-id");
      expect(result.user.email).toBe("test@example.com");
      expect(result.user.ip_address).toBe("127.0.0.1");
      expect(result.user.govuk_signin_journey_id).toBe(
        "test-client-session-id"
      );
      expect(result.platform.user_agent).toBe("test-user-agent");
      expect(result.extensions["journey-type"]).toBe("ACCOUNT_MANAGEMENT");
      expect(result.extensions["mfa-type"]).toBe("SMS");
      expect(result.extensions.phone_number_country_code).toBe("44");
      expect(result.user.phone).toBe("+447987654321");
      expect(result.event_timestamp_ms).toBe(1726099200000);
      expect(result.event_timestamp_ms_formatted).toBe(
        "2024-09-12T00:00:00.000Z"
      );
      expect(result.timestamp).toBe(1726099200);
      expect(atob(result.restricted.device_information.encoded)).toBe(
        "test-txma-header"
      );
    });
  });

  describe("send", () => {
    it("should send the event to SQS", () => {
      const service = eventService(sqs);

      service.send(
        { event_name: EventName.HOME_TRIAGE_PAGE_EMAIL },
        "session-id"
      );

      expect(sendSpy).toHaveBeenCalledOnce();
      expect(sendSpy).toHaveBeenCalledWith(
        JSON.stringify({ event_name: "HOME_TRIAGE_PAGE_EMAIL" }),
        "session-id"
      );
    });

    it("should stringify the event object before sending", () => {
      const service = eventService(sqs);

      const mockEvent = { event_name: EventName.HOME_TRIAGE_PAGE_EMAIL };
      service.send(mockEvent, "session-id");

      expect(sendSpy).toHaveBeenCalledWith(
        JSON.stringify(mockEvent),
        "session-id"
      );
    });
  });
});
