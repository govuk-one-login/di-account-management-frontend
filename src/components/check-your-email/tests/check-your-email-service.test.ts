import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import nock from "nock";
import { checkYourEmailService } from "../check-your-email-service.js";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../../app.constants";
import { UpdateInformationInput } from "../../../utils/types";
import {
  CLIENT_SESSION_ID,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";
import { http } from "../../../utils/http.js";

describe("checkYourEmailService", () => {
  beforeEach(() => {});

  afterEach(() => {
    vi.restoreAllMocks();
    nock.cleanAll();
  });

  it("update the email", async () => {
    const token = "1234";
    const existingEmailAddress = "something@test.com";
    const replacementEmailAddress = "something@test.com";
    const otp = "9876";
    const sourceIp = "0.0.0.0";
    const sessionId = "session-123";
    const persistentSessionId = "persistentsession123";
    const userLanguage = "en";

    const httpPostSpy = vi
      .spyOn(http, "post")
      .mockResolvedValueOnce({
        status: HTTP_STATUS_CODES.NO_CONTENT,
        ok: true,
        clone: vi.fn().mockReturnValue({ json: vi.fn().mockResolvedValue({}) }),
        json: vi.fn().mockResolvedValue({}),
      } as unknown as Response)
      .mockResolvedValueOnce({
        status: HTTP_STATUS_CODES.FORBIDDEN,
        ok: false,
        clone: vi
          .fn()
          .mockReturnValue({ json: vi.fn().mockResolvedValue({ code: 1089 }) }),
        json: vi.fn().mockResolvedValue({ code: 1089 }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        status: HTTP_STATUS_CODES.BAD_REQUEST,
        ok: false,
        clone: vi.fn().mockReturnValue({ json: vi.fn().mockResolvedValue({}) }),
        json: vi.fn().mockResolvedValue({}),
      } as unknown as Response);

    const updateInput: UpdateInformationInput = {
      email: existingEmailAddress,
      updatedValue: replacementEmailAddress,
      otp,
    };

    const requestConfig = {
      token,
      sourceIp,
      sessionId,
      persistentSessionId,
      userLanguage,
      clientSessionId: CLIENT_SESSION_ID,
      txmaAuditEncoded: TXMA_AUDIT_ENCODED,
    };

    let emailUpdated = await checkYourEmailService().updateEmail(
      updateInput,
      requestConfig
    );

    expect(emailUpdated).toEqual({
      success: true,
      error: undefined,
    });

    emailUpdated = await checkYourEmailService().updateEmail(
      updateInput,
      requestConfig
    );

    expect(emailUpdated).toEqual({
      success: false,
      error: "EMAIL_ADDRESS_DENIED",
    });

    emailUpdated = await checkYourEmailService().updateEmail(
      updateInput,
      requestConfig
    );

    expect(emailUpdated).toEqual({
      success: false,
      error: undefined,
    });

    expect(httpPostSpy).toHaveBeenCalledTimes(3);

    const expectedRequestBody = {
      existingEmailAddress: existingEmailAddress,
      replacementEmailAddress: replacementEmailAddress,
      otp: otp,
    };

    const expectedConfig = expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: `Bearer ${token}`,
        "X-Forwarded-For": sourceIp,
        "di-persistent-session-id": persistentSessionId,
        "Session-Id": sessionId,
        "User-Language": userLanguage,
        "txma-audit-encoded": TXMA_AUDIT_ENCODED,
        "Client-Session-Id": CLIENT_SESSION_ID,
      }),
    });

    expect(httpPostSpy).toHaveBeenNthCalledWith(
      1,
      API_ENDPOINTS.UPDATE_EMAIL,
      expectedRequestBody,
      expectedConfig
    );

    expect(httpPostSpy).toHaveBeenNthCalledWith(
      2,
      API_ENDPOINTS.UPDATE_EMAIL,
      expectedRequestBody,
      expectedConfig
    );

    expect(httpPostSpy).toHaveBeenNthCalledWith(
      3,
      API_ENDPOINTS.UPDATE_EMAIL,
      expectedRequestBody,
      expectedConfig
    );
  });
});
