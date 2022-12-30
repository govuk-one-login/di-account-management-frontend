import nock from 'nock';
import { sinon } from "../../../../test/utils/test-utils";
import { changeEmailService } from "../change-email-service";
import { expect } from "chai";
import { API_ENDPOINTS, NOTIFICATION_TYPE } from "../../../app.constants";
import { getApiBaseUrl } from '../../../config';

const baseUrl = getApiBaseUrl()

describe.only("changeEmailService", () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
    nock.cleanAll
  });

  after(nock.restore)

  it("send Code verification Notification", async () => {
    const accessToken = "1234";
    const email = "something@test.com";
    const sourceIp = "0.0.0.0";
    const sessionId = "session-123";
    const persistentSessionId = "persistentsession123";
    const userLanguage = "en";

    nock(baseUrl, {
      reqheaders: {
        "authorization": `Bearer ${accessToken}`,
        "x-forwarded-for": sourceIp,
        "di-persistent-session-id": persistentSessionId,
        "session-id": sessionId + "boop",
        "user-language": userLanguage,
      }
    }).post(
      API_ENDPOINTS.SEND_NOTIFICATION,
      {
        email: email,
        notificationType: NOTIFICATION_TYPE.VERIFY_EMAIL,
      },
    ).reply(204);

    const sendCodeVerificationNotification = await changeEmailService()
    .sendCodeVerificationNotification(
        accessToken,
        email,
        sourceIp,
        sessionId,
        persistentSessionId,
        userLanguage,
      )
      
      expect(sendCodeVerificationNotification).to.true;
  });
});
