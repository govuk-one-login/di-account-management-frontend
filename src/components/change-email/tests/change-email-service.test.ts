import nock from "nock";
import { sinon } from "../../../../test/utils/test-utils.js";
import { changeEmailService } from "../change-email-service";
import { expect } from "chai";
import { describe } from "mocha";
import {
  API_ENDPOINTS,
  NOTIFICATION_TYPE,
  HTTP_STATUS_CODES,
} from "../../../app.constants.js";
import { getApiBaseUrl } from "../../../config.js";

const baseUrl = getApiBaseUrl();

describe("changeEmailService", () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
    nock.cleanAll();
  });

  it("send Code verification Notification", async () => {
    const accessToken = "1234";
    const email = "something@test.com";
    const sourceIp = "0.0.0.0";
    const sessionId = "session-123";
    const persistentSessionId = "persistentsession123";
    const userLanguage = "en";
    const clientSessionId: string = "clientsessionid";

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
        notificationType: NOTIFICATION_TYPE.VERIFY_EMAIL,
      })
      .reply(HTTP_STATUS_CODES.NO_CONTENT);

    const sendCodeVerificationNotification =
      await changeEmailService().sendCodeVerificationNotification(
        accessToken,
        email,
        sourceIp,
        sessionId,
        persistentSessionId,
        userLanguage,
        clientSessionId,
        ""
      );

    expect(sendCodeVerificationNotification).to.true;
  });
});
