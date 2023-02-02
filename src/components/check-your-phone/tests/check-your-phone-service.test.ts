import nock from "nock";
import { sinon } from "../../../../test/utils/test-utils";
import { checkYourPhoneService } from "../check-your-phone-service";
import { expect } from "chai";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../../app.constants";
import { getApiBaseUrl } from "../../../config";

const baseUrl = getApiBaseUrl();

describe("checkYourPhoneService", () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
    nock.cleanAll;
  });

  it("update the phone number ", async () => {
    const accessToken = "1234";
    const email = "something@test.com";
    const phoneNumber = "11111111111";
    const otp = "9876";
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
      .post(API_ENDPOINTS.UPDATE_PHONE_NUMBER, {
        email,
        otp,
        phoneNumber,
      })
      .reply(HTTP_STATUS_CODES.NO_CONTENT);

    const phoneNumberUpdated = await checkYourPhoneService().updatePhoneNumber(
      accessToken,
      email,
      phoneNumber,
      otp,
      sourceIp,
      sessionId,
      persistentSessionId,
      userLanguage
    );

    expect(phoneNumberUpdated).to.be.true;
  });
});