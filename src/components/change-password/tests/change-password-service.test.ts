import nock from "nock";
import { sinon } from "../../../../test/utils/test-utils";
import { changePasswordService } from "../change-password-service";
import { expect } from "chai";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../../app.constants";
import { getApiBaseUrl } from "../../../config";

const baseUrl = getApiBaseUrl();

describe("changePasswordService", () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
    nock.cleanAll;
  });

  //after(nock.restore);

  it("update password", async () => {
    const accessToken = "1234";
    const email = "something@test.com";
    const newPassword = "newPassword";
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
      .post(API_ENDPOINTS.UPDATE_PASSWORD, {
        email: email,
        newPassword: newPassword,
      })
      .reply(HTTP_STATUS_CODES.NO_CONTENT);

    const updatePasswordResult = await changePasswordService().updatePassword(
      accessToken,
      email,
      newPassword,
      sourceIp,
      sessionId,
      persistentSessionId,
      userLanguage
    );
    // console.log(JSON.stringify(updatePasswordResult));
    expect(updatePasswordResult.success).to.be.true;
  });
});
