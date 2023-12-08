import { Request } from "express";
import { describe } from "mocha";
import { sinon } from "../../../test/utils/test-utils";
import { logger } from "../../../src/utils/logger";

import { expect } from "chai";
import {
  CLIENT_SESSION_ID_UNKNOWN,
  LOG_MESSAGES,
  PERSISTENT_SESSION_ID_UNKNOWN,
  SESSION_ID_UNKNOWN,
} from "../../../src/app.constants";

import { getSessionIdsFrom } from "../../../src/utils/session-ids";

describe("Session Ids Util Tests", () => {
  describe("Extract session ids from Request", () => {
    let loggerSpy: sinon.SinonSpy;
    let errorLoggerSpy: sinon.SinonSpy;
    const SESSION_ID = "session-id";
    const CLIENT_SESSION_ID = "client-session-id";
    const PERSISTENT_SESSION_ID = "persistent-session-id";

    beforeEach(() => {
      loggerSpy = sinon.spy(logger, "info");
      errorLoggerSpy = sinon.spy(logger, "error");
    });

    afterEach(() => {
      loggerSpy.restore();
      errorLoggerSpy.restore();
    });

    it("should extract all three session ids and return a SessionIds object", () => {
      const mockRequest: Partial<Request> = {
        cookies: {
          gs: `${SESSION_ID}.${CLIENT_SESSION_ID}`,
          "di-persistent-session-id": PERSISTENT_SESSION_ID,
        },
      };

      const result = getSessionIdsFrom(mockRequest as Request);

      expect(result.sessionId).to.equal(SESSION_ID);
      expect(result.clientSessionId).to.equal(CLIENT_SESSION_ID);
      expect(result.persistentSessionId).to.equal(PERSISTENT_SESSION_ID);
    });

    it("handles a malformed gs cookie", () => {
      const mockRequest: Partial<Request> = {
        cookies: {
          gs: `${SESSION_ID}${CLIENT_SESSION_ID}`,
          "di-persistent-session-id": PERSISTENT_SESSION_ID,
        },
      };

      const result = getSessionIdsFrom(mockRequest as Request);

      expect(result.sessionId).to.equal(SESSION_ID_UNKNOWN);
      expect(result.clientSessionId).to.equal(CLIENT_SESSION_ID_UNKNOWN);
      expect(result.persistentSessionId).to.equal(PERSISTENT_SESSION_ID);
      expect(errorLoggerSpy).to.have.been.calledWith(
        LOG_MESSAGES.MALFORMED_GS_COOKIE(`${SESSION_ID}${CLIENT_SESSION_ID}`)
      );
    });

    it("should handle missing gs cookie", () => {
      const mockRequest: Partial<Request> = {
        cookies: {
          "di-persistent-session-id": PERSISTENT_SESSION_ID,
        },
      };
      const result = getSessionIdsFrom(mockRequest as Request);

      expect(result.sessionId).to.equal(SESSION_ID_UNKNOWN);
      expect(result.clientSessionId).to.equal(CLIENT_SESSION_ID_UNKNOWN);
      expect(result.persistentSessionId).to.equal(PERSISTENT_SESSION_ID);
      expect(loggerSpy).to.have.been.calledWith(
        LOG_MESSAGES.GS_COOKIE_NOT_IN_REQUEST
      );
    });

    it("should handle missing di persistent session id cookie", () => {
      const mockRequest: Partial<Request> = {
        cookies: {
          gs: `${SESSION_ID}.${CLIENT_SESSION_ID}`,
        },
      };

      const result = getSessionIdsFrom(mockRequest as Request);

      expect(result.sessionId).to.equal(SESSION_ID);
      expect(result.clientSessionId).to.equal(CLIENT_SESSION_ID);
      expect(result.persistentSessionId).to.equal(
        PERSISTENT_SESSION_ID_UNKNOWN
      );
      expect(loggerSpy).to.have.been.calledWith(
        { trace: SESSION_ID },
        LOG_MESSAGES.DI_PERSISTENT_SESSION_ID_COOKIE_NOT_IN_REQUEST
      );
    });

    it("should handle no cookies in request", () => {
      const mockRequest: Partial<Request> = {
        cookies: {},
      };

      const result = getSessionIdsFrom(mockRequest as Request);

      expect(result.sessionId).to.equal(SESSION_ID_UNKNOWN);
      expect(result.clientSessionId).to.equal(CLIENT_SESSION_ID_UNKNOWN);
      expect(result.persistentSessionId).to.equal(
        PERSISTENT_SESSION_ID_UNKNOWN
      );
      expect(loggerSpy).to.have.been.calledWith(
        LOG_MESSAGES.GS_COOKIE_NOT_IN_REQUEST
      );
      expect(loggerSpy).to.have.been.calledWith(
        { trace: SESSION_ID_UNKNOWN },
        LOG_MESSAGES.DI_PERSISTENT_SESSION_ID_COOKIE_NOT_IN_REQUEST
      );
    });
  });
});
