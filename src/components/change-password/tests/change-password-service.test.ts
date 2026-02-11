import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import nock from "nock";
import { changePasswordService } from "../change-password-service.js";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../../app.constants";
import { getApiBaseUrl } from "../../../config.js";
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

const baseUrl = getApiBaseUrl();

describe("changePasswordService", () => {
  beforeEach(() => {});

  afterEach(() => {
    vi.restoreAllMocks();
    nock.cleanAll();
  });

  it("update password", async () => {
    const newPassword = "newPassword";

    nock(baseUrl, {
      reqheaders: {
        authorization: `Bearer ${TOKEN}`,
        "x-forwarded-for": SOURCE_IP,
        "di-persistent-session-id": PERSISTENT_SESSION_ID,
        "session-id": SESSION_ID,
        "user-language": ENGLISH,
        "txma-audit-encoded": TXMA_AUDIT_ENCODED,
      },
    })
      .post(API_ENDPOINTS.UPDATE_PASSWORD, {
        email: CURRENT_EMAIL,
        newPassword: newPassword,
      })
      .reply(HTTP_STATUS_CODES.NO_CONTENT);

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
  });
});
