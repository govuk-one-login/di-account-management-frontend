import nock from "nock";
import { sinon } from "../../../../test/utils/test-utils";
import { enterPasswordService } from "../enter-password-service";
import { expect } from "chai";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../../app.constants";
import { getApiBaseUrl } from "../../../config";
import { describe } from "mocha";
import {
  CLIENT_SESSION_ID,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";

const baseUrl = getApiBaseUrl();

describe("enterPasswordService", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    process.env.ENABLE_CHANGE_ON_INTERVENTION = "1";
  });

  afterEach(() => {
    process.env.ENABLE_CHANGE_ON_INTERVENTION = "0";
    sandbox.restore();
    nock.cleanAll();
  });

  it("Check if Authenticated  ", async () => {
    const accessToken = "1234";
    const email = "something@test.com";
    const password = "password";
    const sourceIp = "0.0.0.0";
    const sessionId = "session-123";
    const persistentSessionId = "persistentsession123";
    const user = {
      token: accessToken,
      email: email,
      password: password,
    };

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
        password: password,
      })
      .reply(HTTP_STATUS_CODES.NO_CONTENT);

    const response = await enterPasswordService().authenticated(
      user.email,
      user.password,
      {
        token: user.token,
        sourceIp,
        sessionId,
        persistentSessionId,
        clientSessionId: CLIENT_SESSION_ID,
        txmaAuditEncoded: TXMA_AUDIT_ENCODED,
      }
    );

    expect(response.authenticated).to.be.true;
  });

  it("Check if intervention BLOCKED", async () => {
    const accessToken = "1234";
    const email = "something@test.com";
    const password = "password";
    const sourceIp = "0.0.0.0";
    const sessionId = "session-123";
    const persistentSessionId = "persistentsession123";
    const user = {
      token: accessToken,
      email: email,
      password: password,
    };

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
        password: password,
      })
      .reply(HTTP_STATUS_CODES.FORBIDDEN, {
        code: "1084",
        message: "BLOCKED",
      });

    const response = await enterPasswordService().authenticated(
      user.email,
      user.password,
      {
        token: user.token,
        sourceIp,
        sessionId,
        persistentSessionId,
        clientSessionId: CLIENT_SESSION_ID,
        txmaAuditEncoded: TXMA_AUDIT_ENCODED,
      }
    );

    expect(response.authenticated).to.be.false;
    expect(response.intervention).to.equal("BLOCKED");
  });

  it("Check if intervention SUSPENDED", async () => {
    const accessToken = "1234";
    const email = "something@test.com";
    const password = "password";
    const sourceIp = "0.0.0.0";
    const sessionId = "session-123";
    const persistentSessionId = "persistentsession123";
    const user = {
      token: accessToken,
      email: email,
      password: password,
    };

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
        password: password,
      })
      .reply(HTTP_STATUS_CODES.FORBIDDEN, {
        code: "1083",
        message: "SUSPENDED",
      });

    const response = await enterPasswordService().authenticated(
      user.email,
      user.password,
      {
        token: user.token,
        sourceIp,
        sessionId,
        persistentSessionId,
        clientSessionId: CLIENT_SESSION_ID,
        txmaAuditEncoded: TXMA_AUDIT_ENCODED,
      }
    );

    expect(response.authenticated).to.be.false;
    expect(response.intervention).to.equal("SUSPENDED");
  });

  it("Check if support intervention disabled", async () => {
    process.env.ENABLE_CHANGE_ON_INTERVENTION = "0";
    const accessToken = "1234";
    const email = "something@test.com";
    const password = "password";
    const sourceIp = "0.0.0.0";
    const sessionId = "session-123";
    const persistentSessionId = "persistentsession123";
    const user = {
      token: accessToken,
      email: email,
      password: password,
    };

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
        password: password,
      })
      .reply(HTTP_STATUS_CODES.FORBIDDEN, {
        code: "1083",
        message: "SUSPENDED",
      });

    const response = await enterPasswordService().authenticated(
      user.email,
      user.password,
      {
        token: user.token,
        sourceIp,
        sessionId,
        persistentSessionId,
        clientSessionId: CLIENT_SESSION_ID,
        txmaAuditEncoded: TXMA_AUDIT_ENCODED,
      }
    );

    expect(response.authenticated).to.be.false;
    expect(response.intervention).to.equal(undefined);
  });
});
