import nock from "nock";
import { sinon } from "../../../../test/utils/test-utils";
import { checkYourPhoneService } from "../check-your-phone-service";
import { expect } from "chai";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../../app.constants";
import { getApiBaseUrl } from "../../../config";
import {
  UpdateInformationInput,
  UpdateInformationSessionValues,
} from "../../../utils/types";
import { describe } from "mocha";
import {
  CLIENT_SESSION_ID,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";
import { MfaMethod } from "../../../utils/mfa/types";
import * as mfaModule from "../../../utils/mfa";

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

    const sessionDetails: UpdateInformationSessionValues = {
      accessToken,
      sourceIp,
      sessionId,
      persistentSessionId,
      userLanguage,
      clientSessionId: CLIENT_SESSION_ID,
      txmaAuditEncoded: TXMA_AUDIT_ENCODED,
    };

    const phoneNumberUpdated = await checkYourPhoneService().updatePhoneNumber(
      updateInput,
      sessionDetails
    );

    expect(phoneNumberUpdated).to.be.true;
  });

  it("update the phone number with mfa method management api", async () => {
    const accessToken = "1234";
    const email = "something@test.com";
    const phoneNumber = "11111111111";
    const otp = "9876";
    const sourceIp = "0.0.0.0";
    const sessionId = "session-123";
    const persistentSessionId = "persistentsession123";
    const userLanguage = "en";

    process.env.SUPPORT_CHANGE_MFA = "1";

    const mfaMethod: MfaMethod = {
      mfaIdentifier: 111111,
      methodVerified: true,
      endPoint: "PHONE",
      mfaMethodType: "SMS",
      priorityIdentifier: "DEFAULT",
    };

    const updateMfaMethod = sinon.fake.returns(Promise.resolve(true));

    sandbox.replace(
      mfaModule,
      "updateMfaMethod",
      updateMfaMethod as typeof mfaModule.updateMfaMethod
    );

    const updateInput: UpdateInformationInput = {
      email,
      updatedValue: phoneNumber,
      otp,
      mfaMethod,
    };

    const sessionDetails: UpdateInformationSessionValues = {
      accessToken,
      sourceIp,
      sessionId,
      persistentSessionId,
      userLanguage,
      clientSessionId: CLIENT_SESSION_ID,
      txmaAuditEncoded: TXMA_AUDIT_ENCODED,
    };

    const phoneNumberUpdated =
      await checkYourPhoneService().updatePhoneNumberWithMfaApi(
        updateInput,
        sessionDetails
      );

    expect(phoneNumberUpdated).to.be.true;
    delete process.env.SUPPORT_CHANGE_MFA;
  });
});
