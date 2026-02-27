import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import nock from "nock";
import { checkYourEmailService } from "../check-your-email-service.js";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../../app.constants";
import { getApiBaseUrl } from "../../../config.js";
import { UpdateInformationInput } from "../../../utils/types";
import {
  CLIENT_SESSION_ID,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";

const baseUrl = getApiBaseUrl();

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

    const updateEmailNock = nock(baseUrl, {
      reqheaders: {
        authorization: `Bearer ${token}`,
        "x-forwarded-for": sourceIp,
        "di-persistent-session-id": persistentSessionId,
        "session-id": sessionId,
        "user-language": userLanguage,
        "txma-audit-encoded": TXMA_AUDIT_ENCODED,
      },
    }).post(API_ENDPOINTS.UPDATE_EMAIL, {
      existingEmailAddress: existingEmailAddress,
      replacementEmailAddress: replacementEmailAddress,
      otp: otp,
    });

    updateEmailNock.reply(HTTP_STATUS_CODES.NO_CONTENT);

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

    updateEmailNock.reply(HTTP_STATUS_CODES.FORBIDDEN, {
      code: 1089,
    });

    emailUpdated = await checkYourEmailService().updateEmail(
      updateInput,
      requestConfig
    );

    expect(emailUpdated).toEqual({
      success: false,
      error: "EMAIL_ADDRESS_DENIED",
    });

    updateEmailNock.reply(HTTP_STATUS_CODES.BAD_REQUEST);

    emailUpdated = await checkYourEmailService().updateEmail(
      updateInput,
      requestConfig
    );

    expect(emailUpdated).toEqual({
      success: false,
      error: undefined,
    });
  });
});
