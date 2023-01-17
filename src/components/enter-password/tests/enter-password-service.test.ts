import nock from "nock";
import { sinon } from "../../../../test/utils/test-utils";
import { enterPasswordService } from "../enter-password-service";
import { expect } from "chai";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../../app.constants";
import { getApiBaseUrl } from "../../../config";

const baseUrl = getApiBaseUrl();

describe("enterPasswordService", () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
    nock.cleanAll;
  });

  it("Check if Authenticated  ", async () => {
    const accessToken = "1234";
    const email = "something@test.com";
    const passowrd = "password";
    const sourceIp = "0.0.0.0";
    const sessionId = "session-123";
    const persistentSessionId = "persistentsession123";

    nock(baseUrl, {
      reqheaders: {
        authorization: `Bearer ${accessToken}`,
        "x-forwarded-for": sourceIp,
        "di-persistent-session-id": persistentSessionId,
        "session-id": sessionId,
      },
    })
      .post(API_ENDPOINTS.AUTHENTICATE, {
        email: email,
        password: passowrd,
      })
      .reply(HTTP_STATUS_CODES.NO_CONTENT);

    const isAuthenticated = await enterPasswordService().authenticated(
      accessToken,
      email,
      passowrd,
      sourceIp,
      sessionId,
      persistentSessionId
    );

    expect(isAuthenticated).to.be.true;
  });
});
