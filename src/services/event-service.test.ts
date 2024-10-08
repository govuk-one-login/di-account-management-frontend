import { expect } from "chai";
import { describe } from "mocha";
import sinon from "sinon";
import { SqsService } from "../utils/types";
import { eventService } from "./event-service";
import {
  MISSING_APP_SESSION_ID_SPECIAL_CASE,
  MISSING_PERSISTENT_SESSION_ID_SPECIAL_CASE,
  MISSING_SESSION_ID_SPECIAL_CASE,
  MISSING_USER_ID_SPECIAL_CASE,
} from "../app.constants";
import { SinonFakeTimers } from "sinon";

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

    it("should build an audit event correctly", () => {
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

      const result = service.buildAuditEvent(mockReq, mockRes, "TEST_EVENT");

      expect(result.component_id).to.equal("HOME");
      expect(result.event_name).to.equal("TEST_EVENT");
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
      expect(result.extensions.is_signed_in).to.equal(true);
      expect(result.extensions.is_signed_in).to.equal(true);
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

      const result = service.buildAuditEvent(mockReq, mockRes, "TEST_EVENT");

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

      const result = service.buildAuditEvent(mockReq, mockRes, "TEST_EVENT");

      expect(result.extensions.from_url).to.be.undefined;
      expect(result.extensions.app_error_code).to.be.undefined;
      expect(result.extensions.app_session_id).to.equal(
        MISSING_APP_SESSION_ID_SPECIAL_CASE
      );
      expect(result.restricted).to.be.undefined;
    });
  });

  describe("send", () => {
    it("should send the event to SQS", () => {
      const service = eventService(sqs);

      service.send({ event_name: "TEST_EVENT" }, "session-id");

      expect(sendSpy.calledOnce).to.be.true;
      expect(sendSpy.calledWith(JSON.stringify({ event_name: "TEST_EVENT" })))
        .to.be.true;
    });

    it("should stringify the event object before sending", () => {
      const service = eventService(sqs);

      const mockEvent = { event_name: "MOCK_EVENT" };
      service.send(mockEvent, "session-id");

      expect(sendSpy.calledOnceWith(JSON.stringify(mockEvent))).to.be.true;
    });
  });
});
