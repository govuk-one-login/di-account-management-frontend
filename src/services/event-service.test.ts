import { expect } from "chai";
import { describe } from "mocha";
import sinon from "sinon";
import { SqsService } from "../utils/types";
import { eventService } from "./event-service";
import {
  EventName,
  MISSING_APP_SESSION_ID_SPECIAL_CASE,
  MISSING_PERSISTENT_SESSION_ID_SPECIAL_CASE,
  MISSING_SESSION_ID_SPECIAL_CASE,
  MISSING_USER_ID_SPECIAL_CASE,
} from "../app.constants";
import { SinonFakeTimers } from "sinon";
import { SmsMethod } from "src/utils/mfaClient/types";

describe("eventService", () => {
  let sqs: SqsService;
  let sendSpy: sinon.SinonSpy;

  beforeEach(() => {
    sendSpy = sinon.spy();
    sqs = { send: sendSpy } as any;
  });

  describe("buildAuditEvent", () => {
    let clock: SinonFakeTimers;

    beforeEach(() => {
      clock = sinon.useFakeTimers(new Date(Date.UTC(2023, 20, 12)));
    });

    afterEach(() => {
      clock.restore();
    });

    it("should build a HOME_TRIAGE_PAGE_EMAIL audit event correctly", () => {
      const service = eventService(sqs);

      const mockReq: any = {
        headers: {
          "user-agent": "test-user-agent",
          "txma-audit-encoded": btoa("test-txma-header"),
        },
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
        EventName.HOME_TRIAGE_PAGE_EMAIL
      );

      expect(result.component_id).to.equal("HOME");
      expect(result.event_name).to.equal("HOME_TRIAGE_PAGE_EMAIL");
      expect(result.user.session_id).to.equal("test-session-id");
      expect(result.user.persistent_session_id).to.equal(
        "test-persistent-session-id"
      );
      expect(result.user.user_id).to.equal("test-user-id");
      expect(result.platform.user_agent).to.equal("test-user-agent");
      expect(result.extensions.from_url).to.equal("test-from-url");
      expect(result.extensions.app_error_code).to.equal("test-error-code");
      expect(result.extensions.app_session_id).to.equal("test-app-session-id");
      expect(result.extensions.reference_code).to.equal("test-reference-code");
      expect(result.extensions.is_signed_in).to.equal(true);
      expect(result.event_timestamp_ms).to.equal(1726099200000);
      expect(result.event_timestamp_ms_formatted).to.equal(
        "2024-09-12T00:00:00.000Z"
      );
      expect(result.timestamp).to.equal(1726099200);
      expect(atob(result.restricted.device_information.encoded)).to.equal(
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

      expect(result.user.session_id).to.equal(MISSING_SESSION_ID_SPECIAL_CASE);
      expect(result.user.persistent_session_id).to.equal(
        MISSING_PERSISTENT_SESSION_ID_SPECIAL_CASE
      );
      expect(result.user.user_id).to.equal(MISSING_USER_ID_SPECIAL_CASE);
      expect(result.extensions.app_session_id).to.equal(
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

      expect(result.extensions.from_url).to.be.undefined;
      expect(result.extensions.app_error_code).to.be.undefined;
      expect(result.extensions.app_session_id).to.equal(
        MISSING_APP_SESSION_ID_SPECIAL_CASE
      );
      expect(result.restricted).to.be.undefined;
    });

    it("should build a HOME_TRIAGE_PAGE_VISIT event correctly", () => {
      const service = eventService(sqs);

      const mockReq: any = {
        headers: {
          "user-agent": "test-user-agent",
          "txma-audit-encoded": btoa("test-txma-header"),
        },
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
        EventName.HOME_TRIAGE_PAGE_VISIT
      );

      expect(result.component_id).to.equal("HOME");
      expect(result.event_name).to.equal("HOME_TRIAGE_PAGE_VISIT");
      expect(result.user.session_id).to.equal("test-session-id");
      expect(result.user.persistent_session_id).to.equal(
        "test-persistent-session-id"
      );
      expect(result.user.user_id).to.equal("test-user-id");
      expect(result.platform.user_agent).to.equal("test-user-agent");
      expect(result.extensions.from_url).to.equal("test-from-url");
      expect(result.extensions.app_error_code).to.equal("test-error-code");
      expect(result.extensions.app_session_id).to.equal("test-app-session-id");
      expect(result.extensions.reference_code).to.equal("test-reference-code");
      expect(result.extensions.is_signed_in).to.equal(true);
      expect(result.event_timestamp_ms).to.equal(1726099200000);
      expect(result.event_timestamp_ms_formatted).to.equal(
        "2024-09-12T00:00:00.000Z"
      );
      expect(result.timestamp).to.equal(1726099200);
      expect(atob(result.restricted.device_information.encoded)).to.equal(
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
        EventName.AUTH_MFA_METHOD_ADD_STARTED
      );

      expect(result.component_id).to.equal("HOME");
      expect(result.event_name).to.equal("AUTH_MFA_METHOD_ADD_STARTED");
      expect(result.user.session_id).to.equal("test-session-id");
      expect(result.user.persistent_session_id).to.equal(
        "test-persistent-session-id"
      );
      expect(result.user.user_id).to.equal("test-user-id");
      expect(result.platform.user_agent).to.equal("test-user-agent");
      expect(result.extensions["journey-type"]).to.equal("ACCOUNT_MANAGEMENT");
      expect(result.event_timestamp_ms).to.equal(1726099200000);
      expect(result.event_timestamp_ms_formatted).to.equal(
        "2024-09-12T00:00:00.000Z"
      );
      expect(result.timestamp).to.equal(1726099200);
      expect(atob(result.restricted.device_information.encoded)).to.equal(
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
        session: {
          user_id: "test-user-id",
          user: {
            isAuthenticated: true,
          },
          mfaMethods: [
            {
              mfaIdentifier: "1234",
              methodVerified: true,
              method: {
                mfaMethodType: "SMS",
                phoneNumber: "123456789",
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
        },
      };

      const result = service.buildAuditEvent(
        mockReq,
        mockRes,
        EventName.AUTH_MFA_METHOD_SWITCH_STARTED
      );

      expect(result.component_id).to.equal("HOME");
      expect(result.event_name).to.equal("AUTH_MFA_METHOD_SWITCH_STARTED");
      expect(result.user.session_id).to.equal("test-session-id");
      expect(result.user.persistent_session_id).to.equal(
        "test-persistent-session-id"
      );
      expect(result.user.user_id).to.equal("test-user-id");
      expect(result.platform.user_agent).to.equal("test-user-agent");
      expect(result.extensions["journey-type"]).to.equal("ACCOUNT_MANAGEMENT");
      expect(result.extensions["mfa-type"]).to.equal("SMS");
      expect(result.event_timestamp_ms).to.equal(1726099200000);
      expect(result.event_timestamp_ms_formatted).to.equal(
        "2024-09-12T00:00:00.000Z"
      );
      expect(result.timestamp).to.equal(1726099200);
      expect(atob(result.restricted.device_information.encoded)).to.equal(
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

      expect(sendSpy.calledOnce).to.be.true;
      expect(
        sendSpy.calledWith(
          JSON.stringify({ event_name: "HOME_TRIAGE_PAGE_EMAIL" })
        )
      ).to.be.true;
    });

    it("should stringify the event object before sending", () => {
      const service = eventService(sqs);

      const mockEvent = { event_name: EventName.HOME_TRIAGE_PAGE_EMAIL };
      service.send(mockEvent, "session-id");

      expect(sendSpy.calledOnceWith(JSON.stringify(mockEvent))).to.be.true;
    });
  });
});
