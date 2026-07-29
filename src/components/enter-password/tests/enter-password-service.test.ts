import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { enterPasswordService } from "../enter-password-service.js";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../../app.constants";
import {
  CLIENT_SESSION_ID,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";
import { http } from "../../../utils/http.js";

describe("enterPasswordService", () => {
  beforeEach(() => {});

  afterEach(() => {
    vi.restoreAllMocks();
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

    const httpPostSpy = vi.spyOn(http, "post").mockResolvedValue({
      status: HTTP_STATUS_CODES.NO_CONTENT,
      ok: false,
    } as unknown as Response);

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
    expect(httpPostSpy).toHaveBeenCalledWith(
      API_ENDPOINTS.AUTHENTICATE,
      { email: email, password: password },
      expect.any(Object)
    );
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

    const httpPostSpy = vi.spyOn(http, "post").mockResolvedValue({
      status: HTTP_STATUS_CODES.FORBIDDEN,
      ok: false,
      clone: vi.fn().mockReturnValue({
        json: vi.fn().mockResolvedValue({
          code: "1084",
          message: "BLOCKED",
        }),
      }),
      json: vi.fn().mockResolvedValue({
        code: "1084",
        message: "BLOCKED",
      }),
    } as unknown as Response);

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

    expect(httpPostSpy).toHaveBeenCalledWith(
      API_ENDPOINTS.AUTHENTICATE,
      { email: email, password: password },
      expect.any(Object)
    );
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

    const httpPostSpy = vi.spyOn(http, "post").mockResolvedValue({
      status: HTTP_STATUS_CODES.FORBIDDEN,
      ok: false,
      clone: vi.fn().mockReturnValue({
        json: vi.fn().mockResolvedValue({
          code: "1083",
          message: "SUSPENDED",
        }),
      }),
      json: vi.fn().mockResolvedValue({
        code: "1083",
        message: "SUSPENDED",
      }),
    } as unknown as Response);

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

    expect(httpPostSpy).toHaveBeenCalledWith(
      API_ENDPOINTS.AUTHENTICATE,
      { email: email, password: password },
      expect.any(Object)
    );
  });
});
