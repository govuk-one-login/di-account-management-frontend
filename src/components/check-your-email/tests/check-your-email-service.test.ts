import nock from "nock";
import { sinon } from "../../../../test/utils/test-utils";
import { checkYourEmailService } from "../check-your-email-service";
import { expect } from "chai";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../../app.constants";
import { getApiBaseUrl } from "../../../config";
import { UpdateInformationInput, UpdateInformationSessionValues } from "../../../utils/types";

const baseUrl = getApiBaseUrl();

describe("checkYourEmailService", () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
    nock.cleanAll;
  });

  it("update the email ", async () => {
    const accessToken = "1234";
    const existingEmailAddress = "something@test.com";
    const replacementEmailAddress = "something@test.com";
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
      .post(API_ENDPOINTS.UPDATE_EMAIL, {
        existingEmailAddress: existingEmailAddress,
        replacementEmailAddress: replacementEmailAddress,
        otp: otp,
      })
      .reply(HTTP_STATUS_CODES.NO_CONTENT);

    const updateInput : UpdateInformationInput = {
      email: existingEmailAddress,
      updatedValue: replacementEmailAddress,
      otp
    };

    const sessionDetails : UpdateInformationSessionValues = {
      accessToken,
      sourceIp,
      sessionId,
      persistentSessionId,
      userLanguage
    };

    const emailUpdated = await checkYourEmailService().updateEmail(
      updateInput, sessionDetails
    );

    expect(emailUpdated).to.be.true;
  });
});
