import { describe, it, expect, vi, afterEach } from "vitest";
import { enterPasswordService } from "../enter-password-service.js";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../../app.constants";
import { http } from "../../../utils/http.js";

describe("enterPasswordService", () => {
  const accessToken = "1234";
  const email = "something@test.com";
  const password = "password";
  const sourceIp = "0.0.0.0";
  const sessionId = "session-123";
  const persistentSessionId = "persistentsession123";
  const CLIENT_SESSION_ID = "client-session-id-123";
  const TXMA_AUDIT_ENCODED = "txma-audit-encoded-string";

  const user = {
    token: accessToken,
    email: email,
    password: password,
  };

  const requestConfig = {
    token: user.token,
    sourceIp,
    sessionId,
    persistentSessionId,
    clientSessionId: CLIENT_SESSION_ID,
    txmaAuditEncoded: TXMA_AUDIT_ENCODED,
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Check if Authenticated", async () => {
    const httpPostSpy = vi.spyOn(http, "post").mockResolvedValue({
      status: HTTP_STATUS_CODES.NO_CONTENT,
      ok: true,
      headers: {
        get: vi.fn().mockReturnValue(null),
      },
    } as unknown as Response);

    const response = await enterPasswordService().authenticated(
      user.email,
      user.password,
      requestConfig
    );

    expect(response).toEqual({ success: true });
    expect(httpPostSpy).toHaveBeenCalledWith(
      API_ENDPOINTS.AUTHENTICATE,
      { email: email, password: password },
      expect.any(Object)
    );
  });

  it("Check if intervention BLOCKED", async () => {
    const httpPostSpy = vi.spyOn(http, "post").mockResolvedValue({
      status: HTTP_STATUS_CODES.FORBIDDEN,
      ok: false,
      clone: vi.fn().mockReturnValue({
        json: vi.fn().mockResolvedValue({
          code: 1084,
          message: "BLOCKED",
        }),
      }),
      json: vi.fn().mockResolvedValue({
        code: 1084,
        message: "BLOCKED",
      }),
    } as unknown as Response);

    const response = await enterPasswordService().authenticated(
      user.email,
      user.password,
      requestConfig
    );

    expect(response).toEqual({
      success: false,
      hasIntervention: true,
      code: 1084,
    });

    expect(httpPostSpy).toHaveBeenCalledWith(
      API_ENDPOINTS.AUTHENTICATE,
      { email: email, password: password },
      expect.any(Object)
    );
  });

  it("Check if intervention SUSPENDED", async () => {
    const httpPostSpy = vi.spyOn(http, "post").mockResolvedValue({
      status: HTTP_STATUS_CODES.FORBIDDEN,
      ok: false,
      clone: vi.fn().mockReturnValue({
        json: vi.fn().mockResolvedValue({
          code: 1083,
          message: "SUSPENDED",
        }),
      }),
      json: vi.fn().mockResolvedValue({
        code: 1083,
        message: "SUSPENDED",
      }),
    } as unknown as Response);

    const response = await enterPasswordService().authenticated(
      user.email,
      user.password,
      requestConfig
    );

    expect(response).toEqual({
      success: false,
      hasIntervention: true,
      code: 1083,
    });

    expect(httpPostSpy).toHaveBeenCalledWith(
      API_ENDPOINTS.AUTHENTICATE,
      { email: email, password: password },
      expect.any(Object)
    );
  });

  it("Check an unknown intervention code handles hasIntervention correctly on FORBIDDEN", async () => {
    const httpPostSpy = vi.spyOn(http, "post").mockResolvedValue({
      status: HTTP_STATUS_CODES.FORBIDDEN,
      ok: false,
      clone: vi.fn().mockReturnValue({
        json: vi.fn().mockResolvedValue({
          code: 9999,
          message: "UNKNOWN_ERROR",
        }),
      }),
      json: vi.fn().mockResolvedValue({
        code: 9999,
        message: "UNKNOWN_ERROR",
      }),
    } as unknown as Response);

    const response = await enterPasswordService().authenticated(
      user.email,
      user.password,
      requestConfig
    );

    expect(response).toEqual({
      success: false,
      hasIntervention: true,
      code: 9999,
    });

    expect(httpPostSpy).toHaveBeenCalledWith(
      API_ENDPOINTS.AUTHENTICATE,
      { email: email, password: password },
      expect.any(Object)
    );
  });

  it("returns code and message when status code UNAUTHORIZED", async () => {
    const httpPostSpy = vi.spyOn(http, "post").mockResolvedValue({
      status: HTTP_STATUS_CODES.UNAUTHORIZED,
      ok: false,
      headers: {
        get: vi.fn().mockReturnValue(null),
      },
      json: vi.fn().mockResolvedValue({
        code: 1001,
        message: "Invalid login credentials",
      }),
    } as unknown as Response);

    const response = await enterPasswordService().authenticated(
      user.email,
      user.password,
      requestConfig
    );

    expect(response).toEqual({
      success: false,
      code: 1001,
      message: "Invalid login credentials",
    });

    expect(httpPostSpy).toHaveBeenCalledWith(
      API_ENDPOINTS.AUTHENTICATE,
      { email: email, password: password },
      expect.any(Object)
    );
  });
});
