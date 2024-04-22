import nock from "nock";
import { changePhoneNumberService } from "../change-phone-number-service";
import { expect } from "chai";
import {
  API_ENDPOINTS,
  HTTP_STATUS_CODES,
  NOTIFICATION_TYPE,
} from "../../../app.constants";
import { getApiBaseUrl } from "../../../config";
import { describe } from "mocha";
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

describe("changePhoneNumberService", () => {
  it("change the phone number", async () => {
    const phoneNumber = "newPassword";

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
      })
      .reply(HTTP_STATUS_CODES.NO_CONTENT);

    const changePhoneNumberResponse =
      await changePhoneNumberService().sendPhoneVerificationNotification(
        TOKEN,
        CURRENT_EMAIL,
        phoneNumber,
        SOURCE_IP,
        SESSION_ID,
        PERSISTENT_SESSION_ID,
        ENGLISH,
        CLIENT_SESSION_ID,
        TXMA_AUDIT_ENCODED
      );

    expect(changePhoneNumberResponse.success).to.be.true;
  });
});
