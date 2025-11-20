import { Request } from "express";
import { describe } from "mocha";
import sinon from "sinon";
import { logger } from "../logger";

import { expect } from "chai";
import {
  CLIENT_SESSION_ID_UNKNOWN,
  PERSISTENT_SESSION_ID_UNKNOWN,
  SESSION_ID_UNKNOWN,
} from "../../app.constants";

import { getSessionIdsFrom } from "../session-ids";
import { RequestBuilder } from "../../../test/utils/builders";

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
      const mockRequest = new RequestBuilder()
        .withAuthSessionIds(SESSION_ID, CLIENT_SESSION_ID)
        .withCookies({
          "di-persistent-session-id": PERSISTENT_SESSION_ID,
        })
        .build();

      const result = getSessionIdsFrom(mockRequest as Request);

      expect(result.sessionId).to.equal(SESSION_ID);
      expect(result.clientSessionId).to.equal(CLIENT_SESSION_ID);
      expect(result.persistentSessionId).to.equal(PERSISTENT_SESSION_ID);
    });

    it("should handle missing session.authSessionIds", () => {
      const mockRequest = new RequestBuilder()
        .withCookies({
          "di-persistent-session-id": PERSISTENT_SESSION_ID,
        })
        .build();
      const result = getSessionIdsFrom(mockRequest as Request);

      expect(result.sessionId).to.equal(SESSION_ID_UNKNOWN);
      expect(result.clientSessionId).to.equal(CLIENT_SESSION_ID_UNKNOWN);
      expect(result.persistentSessionId).to.equal(PERSISTENT_SESSION_ID);
    });

    it("should handle missing di persistent session id cookie", () => {
      const mockRequest = new RequestBuilder()
        .withAuthSessionIds(SESSION_ID, CLIENT_SESSION_ID)
        .build();

      const result = getSessionIdsFrom(mockRequest as Request);

      expect(result.sessionId).to.equal(SESSION_ID);
      expect(result.clientSessionId).to.equal(CLIENT_SESSION_ID);
      expect(result.persistentSessionId).to.equal(
        PERSISTENT_SESSION_ID_UNKNOWN
      );
    });
  });
});
