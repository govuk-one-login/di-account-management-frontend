import { describe, it, expect, vi } from "vitest";
import nock from "nock";
import { changePhoneNumberService } from "../change-phone-number-service.js";
import {
  API_ENDPOINTS,
  HTTP_STATUS_CODES,
  NOTIFICATION_TYPE,
} from "../../../app.constants";
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
import { http } from "../../../utils/http.js";

const baseUrl = getApiBaseUrl();

describe("changePhoneNumberService", () => {
  it("change the phone number", async () => {
    const phoneNumber = "newPassword";

    const httpPostSpy = vi.spyOn(http, "post").mockResolvedValue({
      status: HTTP_STATUS_CODES.NO_CONTENT,
      ok: true,
      clone: vi.fn().mockReturnValue({
        json: vi.fn().mockResolvedValue({}),
      }),
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response);

    const changePhoneNumberResponse =
      await changePhoneNumberService().sendPhoneVerificationNotification(
        CURRENT_EMAIL,
        phoneNumber,
        "DEFAULT",
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

    expect(changePhoneNumberResponse.success).toBe(true);

    expect(httpPostSpy).toHaveBeenCalledWith(
      API_ENDPOINTS.SEND_NOTIFICATION,
      {
        email: CURRENT_EMAIL,
        phoneNumber: phoneNumber,
        notificationType: NOTIFICATION_TYPE.VERIFY_PHONE_NUMBER,
        priorityIdentifier: "DEFAULT",
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${TOKEN}`,
          "X-Forwarded-For": SOURCE_IP,
          "di-persistent-session-id": PERSISTENT_SESSION_ID,
          "Session-Id": SESSION_ID,
          "User-Language": ENGLISH,
          "txma-audit-encoded": TXMA_AUDIT_ENCODED,
        }),
      })
    );
  });

  it("should include priorityIdentifier BACKUP in the request body", async () => {
    const phoneNumber = "newPhoneNumber";

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
      .post(API_ENDPOINTS.SEND_NOTIFICATION, {
        email: CURRENT_EMAIL,
        phoneNumber: phoneNumber,
        notificationType: NOTIFICATION_TYPE.VERIFY_PHONE_NUMBER,
        priorityIdentifier: "BACKUP",
      })
      .reply(HTTP_STATUS_CODES.NO_CONTENT);

    const result =
      await changePhoneNumberService().sendPhoneVerificationNotification(
        CURRENT_EMAIL,
        phoneNumber,
        "BACKUP",
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

    expect(result.success).toBe(true);
  });
});
