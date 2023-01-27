import nock from "nock";
import { sinon } from "../../../../test/utils/test-utils";
import { changePhoneNumberService } from "../change-phone-number-service";
import { expect } from "chai";
import {
  API_ENDPOINTS,
  HTTP_STATUS_CODES,
  NOTIFICATION_TYPE,
} from "../../../app.constants";
import { getApiBaseUrl } from "../../../config";

const baseUrl = getApiBaseUrl();

describe("changePhoneNumberService", () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
    nock.cleanAll;
  });

  it("change the phone number", async () => {
    const accessToken = "1234";
    const email = "something@test.com";
    const phoneNumber = "newPassword";
    const sourceIp = "0.0.0.0";
    const sessionId = "session-123";
    const persistentSessionId = "persistentsession123";
    const userLanguage = "en";

    nock(baseUrl, {
      reqheaders: {
        authorization: `Bearer ${accessToken}`,
        "x-forwarded-for": sourceIp,
        "di-persistent-session-id": persistentSessionId,
        "session-id": sessionId,
        "user-language": userLanguage,
      },
    })
      .post(API_ENDPOINTS.SEND_NOTIFICATION, {
        email: email,
        phoneNumber: phoneNumber,
        notificationType: NOTIFICATION_TYPE.VERIFY_PHONE_NUMBER,
      })
      .reply(HTTP_STATUS_CODES.NO_CONTENT);

    const changePhoneNumberResponse =
      await changePhoneNumberService().sendPhoneVerificationNotification(
        accessToken,
        email,
        phoneNumber,
        sourceIp,
        sessionId,
        persistentSessionId,
        userLanguage
      );

    expect(changePhoneNumberResponse.success).to.be.true;
  });
});
