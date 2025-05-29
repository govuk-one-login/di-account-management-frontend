import nock from "nock";
import { sinon } from "../../../../test/utils/test-utils";
import { checkYourPhoneService } from "../check-your-phone-service";
import { expect } from "chai";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../../app.constants";
import { getApiBaseUrl } from "../../../config";
import { UpdateInformationInput } from "../../../utils/types";
import { describe } from "mocha";
import {
  CLIENT_SESSION_ID,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";

const baseUrl = getApiBaseUrl();

describe("checkYourPhoneService", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
    nock.cleanAll();
  });

  it("update the phone number ", async () => {
    const token = "1234";
    const email = "something@test.com";
    const phoneNumber = "11111111111";
    const otp = "9876";
    const sourceIp = "0.0.0.0";
    const sessionId = "session-123";
    const persistentSessionId = "persistentsession123";
    const userLanguage = "en";

    nock(baseUrl, {
      reqheaders: {
        authorization: `Bearer ${token}`,
        "x-forwarded-for": sourceIp,
        "di-persistent-session-id": persistentSessionId,
        "session-id": sessionId,
        "user-language": userLanguage,
        "txma-audit-encoded": TXMA_AUDIT_ENCODED,
      },
    })
      .post(API_ENDPOINTS.UPDATE_PHONE_NUMBER, {
        email,
        otp,
        phoneNumber,
      })
      .reply(HTTP_STATUS_CODES.NO_CONTENT);

    const updateInput: UpdateInformationInput = {
      email,
      updatedValue: phoneNumber,
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

    const phoneNumberUpdated = await checkYourPhoneService().updatePhoneNumber(
      updateInput,
      requestConfig
    );

    expect(phoneNumberUpdated).to.be.true;
  });
});
