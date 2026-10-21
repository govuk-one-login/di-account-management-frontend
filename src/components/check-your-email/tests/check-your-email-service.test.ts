import { describe, it, expect, vi, afterEach } from "vitest";
import nock from "nock";
import { checkYourEmailService } from "../check-your-email-service.js";
import { HTTP_STATUS_CODES, ERROR_CODES } from "../../../app.constants";
import { UpdateInformationInput } from "../../../utils/types";
import {
  CLIENT_SESSION_ID,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";
import { http } from "../../../utils/http.js";

describe("checkYourEmailService", () => {
  const token = "1234";
  const existingEmailAddress = "something@test.com";
  const replacementEmailAddress = "something@test.com";
  const otp = "9876";
  const sourceIp = "0.0.0.0";
  const sessionId = "session-123";
  const persistentSessionId = "persistentsession123";
  const userLanguage = "en";

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

  afterEach(() => {
    vi.restoreAllMocks();
    nock.cleanAll();
  });

  it("handles update email", async () => {
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
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue({
            code: ERROR_CODES.EMAIL_ADDRESS_DENIED,
            message: "Email address denied",
          }),
        }),
        json: vi.fn().mockResolvedValue({
          code: ERROR_CODES.EMAIL_ADDRESS_DENIED,
          message: "Email address denied",
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        status: HTTP_STATUS_CODES.BAD_REQUEST,
        ok: false,
        clone: vi.fn().mockReturnValue({ json: vi.fn().mockResolvedValue({}) }),
        json: vi.fn().mockResolvedValue({}),
      } as unknown as Response);

    let result = await checkYourEmailService().updateEmail(
      updateInput,
      requestConfig
    );
    expect(result).toEqual({ success: true });

    result = await checkYourEmailService().updateEmail(
      updateInput,
      requestConfig
    );
    expect(result).toEqual({
      success: false,
      responseCode: ERROR_CODES.EMAIL_ADDRESS_DENIED,
      responseMessage: "Email address denied",
    });

    result = await checkYourEmailService().updateEmail(
      updateInput,
      requestConfig
    );
    expect(result).toEqual({
      success: false,
      responseCode: undefined,
      responseMessage: undefined,
    });

    expect(httpPostSpy).toHaveBeenCalledTimes(3);
  });

  it("handles other valid email error codes correctly", async () => {
    const httpPostSpy = vi
      .spyOn(http, "post")
      .mockResolvedValueOnce({
        status: HTTP_STATUS_CODES.BAD_REQUEST,
        ok: false,
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue({
            code: ERROR_CODES.INVALID_OTP,
            message: "Invalid OTP code",
          }),
        }),
        json: vi.fn().mockResolvedValue({
          code: ERROR_CODES.INVALID_OTP,
          message: "Invalid OTP code",
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        status: HTTP_STATUS_CODES.BAD_REQUEST,
        ok: false,
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue({
            code: ERROR_CODES.ACCT_WITH_EMAIL_EXISTS,
            message: "Account exists",
          }),
        }),
        json: vi.fn().mockResolvedValue({
          code: ERROR_CODES.ACCT_WITH_EMAIL_EXISTS,
          message: "Account exists",
        }),
      } as unknown as Response);

    let result = await checkYourEmailService().updateEmail(
      updateInput,
      requestConfig
    );
    expect(result).toEqual({
      success: false,
      responseCode: ERROR_CODES.INVALID_OTP,
      responseMessage: "Invalid OTP code",
    });

    result = await checkYourEmailService().updateEmail(
      updateInput,
      requestConfig
    );
    expect(result).toEqual({
      success: false,
      responseCode: ERROR_CODES.ACCT_WITH_EMAIL_EXISTS,
      responseMessage: "Account exists",
    });

    expect(httpPostSpy).toHaveBeenCalledTimes(2);
  });
});
