import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { changePasswordService } from "../change-password-service.js";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../../app.constants";
import {
  CLIENT_SESSION_ID,
  CURRENT_EMAIL,
  ENGLISH,
  PERSISTENT_SESSION_ID,
  SESSION_ID,
  SOURCE_IP,
  TOKEN,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";
import { http } from "../../../utils/http.js";

describe("changePasswordService", () => {
  beforeEach(() => {});

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("update password", async () => {
    const newPassword = "newPassword";
    const httpPostSpy = vi.spyOn(http, "post").mockResolvedValue({
      status: HTTP_STATUS_CODES.NO_CONTENT,
      ok: true,
      clone: vi.fn().mockReturnValue({
        json: vi.fn().mockResolvedValue({}),
      }),
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response);

    const updatePasswordResult = await changePasswordService().updatePassword(
      CURRENT_EMAIL,
      newPassword,
      {
        token: TOKEN,
        sourceIp: SOURCE_IP,
        sessionId: SESSION_ID,
        persistentSessionId: PERSISTENT_SESSION_ID,
        userLanguage: ENGLISH,
        clientSessionId: CLIENT_SESSION_ID,
        txmaAuditEncoded: TXMA_AUDIT_ENCODED,
      }
    );

    expect(updatePasswordResult.success).toBe(true);

    expect(httpPostSpy).toHaveBeenCalledWith(
      API_ENDPOINTS.UPDATE_PASSWORD,
      {
        email: CURRENT_EMAIL,
        newPassword,
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${TOKEN}`,
          "X-Forwarded-For": SOURCE_IP,
          "di-persistent-session-id": PERSISTENT_SESSION_ID,
          "Session-Id": SESSION_ID,
          "User-Language": ENGLISH,
          "txma-audit-encoded": TXMA_AUDIT_ENCODED,
          "Client-Session-Id": CLIENT_SESSION_ID,
        }),
      })
    );
  });
});
