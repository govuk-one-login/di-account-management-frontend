import nock from "nock";
import { sinon } from "../../../../test/utils/test-utils.js";
import { enterPasswordService } from "../enter-password-service.js";
import { expect } from "chai";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../../app.constants.js";
import { getApiBaseUrl } from "../../../config.js";
import { describe } from "mocha";
import {
  CLIENT_SESSION_ID,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders.js";

const baseUrl = getApiBaseUrl();

describe("enterPasswordService", () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
    nock.cleanAll();
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
        "txma-audit-encoded": TXMA_AUDIT_ENCODED,
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
      persistentSessionId,
      CLIENT_SESSION_ID,
      TXMA_AUDIT_ENCODED
    );

    expect(isAuthenticated).to.be.true;
  });
});
