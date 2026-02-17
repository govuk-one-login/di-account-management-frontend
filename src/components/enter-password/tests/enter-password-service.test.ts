import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import nock from "nock";
import { enterPasswordService } from "../enter-password-service.js";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../../app.constants";
import { getApiBaseUrl } from "../../../config.js";
import {
  CLIENT_SESSION_ID,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";

const baseUrl = getApiBaseUrl();

describe("enterPasswordService", () => {
  beforeEach(() => {});

  afterEach(() => {
    vi.restoreAllMocks();
    nock.cleanAll();
  });

  it("Check if Authenticated", async () => {
    const accessToken = "1234";
    const email = "something@test.com";
    const password = "password";
    const sourceIp = "0.0.0.0";
    const sessionId = "session-123";
    const persistentSessionId = "persistentsession123";
    const user = {
      token: accessToken,
      email: email,
      password: password,
    };

    nock(baseUrl, {
      reqheaders: {
        authorization: `Bearer ${accessToken}`,
        "x-forwarded-for": sourceIp,
        "di-persistent-session-id": persistentSessionId,
        "session-id": sessionId,
        "txma-audit-encoded": TXMA_AUDIT_ENCODED,
      },
    })
      .post(API_ENDPOINTS.AUTHENTICATE, {
        email: email,
        password: password,
      })
      .reply(HTTP_STATUS_CODES.NO_CONTENT);

    const response = await enterPasswordService().authenticated(
      user.email,
      user.password,
      {
        token: user.token,
        sourceIp,
        sessionId,
        persistentSessionId,
        clientSessionId: CLIENT_SESSION_ID,
        txmaAuditEncoded: TXMA_AUDIT_ENCODED,
      }
    );

    expect(response.authenticated).toBe(true);
  });

  it("Check if intervention BLOCKED", async () => {
    const accessToken = "1234";
    const email = "something@test.com";
    const password = "password";
    const sourceIp = "0.0.0.0";
    const sessionId = "session-123";
    const persistentSessionId = "persistentsession123";
    const user = {
      token: accessToken,
      email: email,
      password: password,
    };

    nock(baseUrl, {
      reqheaders: {
        authorization: `Bearer ${accessToken}`,
        "x-forwarded-for": sourceIp,
        "di-persistent-session-id": persistentSessionId,
        "session-id": sessionId,
        "txma-audit-encoded": TXMA_AUDIT_ENCODED,
      },
    })
      .post(API_ENDPOINTS.AUTHENTICATE, {
        email: email,
        password: password,
      })
      .reply(HTTP_STATUS_CODES.FORBIDDEN, {
        code: "1084",
        message: "BLOCKED",
      });

    const response = await enterPasswordService().authenticated(
      user.email,
      user.password,
      {
        token: user.token,
        sourceIp,
        sessionId,
        persistentSessionId,
        clientSessionId: CLIENT_SESSION_ID,
        txmaAuditEncoded: TXMA_AUDIT_ENCODED,
      }
    );

    expect(response.authenticated).toBe(false);
    expect(response.intervention).toBe("BLOCKED");
  });

  it("Check if intervention SUSPENDED", async () => {
    const accessToken = "1234";
    const email = "something@test.com";
    const password = "password";
    const sourceIp = "0.0.0.0";
    const sessionId = "session-123";
    const persistentSessionId = "persistentsession123";
    const user = {
      token: accessToken,
      email: email,
      password: password,
    };

    nock(baseUrl, {
      reqheaders: {
        authorization: `Bearer ${accessToken}`,
        "x-forwarded-for": sourceIp,
        "di-persistent-session-id": persistentSessionId,
        "session-id": sessionId,
        "txma-audit-encoded": TXMA_AUDIT_ENCODED,
      },
    })
      .post(API_ENDPOINTS.AUTHENTICATE, {
        email: email,
        password: password,
      })
      .reply(HTTP_STATUS_CODES.FORBIDDEN, {
        code: "1083",
        message: "SUSPENDED",
      });

    const response = await enterPasswordService().authenticated(
      user.email,
      user.password,
      {
        token: user.token,
        sourceIp,
        sessionId,
        persistentSessionId,
        clientSessionId: CLIENT_SESSION_ID,
        txmaAuditEncoded: TXMA_AUDIT_ENCODED,
      }
    );

    expect(response.authenticated).toBe(false);
    expect(response.intervention).toBe("SUSPENDED");
  });
});
