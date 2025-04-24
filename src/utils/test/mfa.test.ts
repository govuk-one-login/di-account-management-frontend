import sinon from "sinon";
import { expect } from "chai";
import { describe } from "mocha";
import { logger } from "../logger";
import * as httpModule from "../http";
import { updateMfaMethod } from "../../../src/utils/mfa";
import { HTTP_STATUS_CODES } from "../../app.constants";
import { MfaMethod } from "../mfaClient/types";
import {
  UpdateInformationInput,
  UpdateInformationSessionValues,
} from "../types";

describe("MFA Function", () => {
  let loggerStub: sinon.SinonStub;
  let httpInstance: sinon.SinonStubbedInstance<any>;
  const clientSessionId = "clientsessionid";
  const txmaAuditEncoded = "txma-audit-encoded";

  beforeEach(() => {
    loggerStub = sinon.stub(logger, "error");
    httpInstance = {
      client: {
        get: sinon.stub(),
        put: sinon.stub(),
      },
    };
    sinon.stub(httpModule, "Http").returns(httpInstance);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should return true on success when SMS mfa method is updated successfully", async () => {
    const accessToken = "1234";
    const email = "something@test.com";
    const phoneNumber = "11111111111";
    const otp = "9876";
    const sourceIp = "0.0.0.0";
    const sessionId = "session-123";
    const persistentSessionId = "persistentsession123";
    const userLanguage = "en";

    const mfaMethod: MfaMethod = {
      mfaIdentifier: "111111",
      methodVerified: true,
      method: {
        phoneNumber: phoneNumber,
        mfaMethodType: "SMS",
      },
      priorityIdentifier: "DEFAULT",
    };

    const updateInput: UpdateInformationInput = {
      email,
      otp,
      mfaMethod,
    };

    const sessionDetails: UpdateInformationSessionValues = {
      accessToken,
      sourceIp,
      sessionId,
      persistentSessionId,
      userLanguage,
      clientSessionId: clientSessionId,
      txmaAuditEncoded: txmaAuditEncoded,
    };

    httpInstance.client.put.resolves({
      status: HTTP_STATUS_CODES.OK,
      data: mfaMethod,
    });

    const result = await updateMfaMethod(updateInput, sessionDetails);
    expect(result).to.be.true;
    expect(httpInstance.client.put.calledOnce).to.be.true;
    expect(loggerStub.called).to.be.false;
  });

  it("should return true on success when auth mfa method is updated successfully", async () => {
    const accessToken = "1234";
    const email = "something@test.com";
    const sourceIp = "0.0.0.0";
    const sessionId = "session-123";
    const persistentSessionId = "persistentsession123";
    const userLanguage = "en";
    const code = "qrcode";
    const authAppSecret = "A".repeat(20);

    const mfaMethod: MfaMethod = {
      mfaIdentifier: "111111",
      methodVerified: true,
      method: {
        mfaMethodType: "AUTH_APP",
        credential: authAppSecret,
      },
      priorityIdentifier: "DEFAULT",
    };

    const updateInput: UpdateInformationInput = {
      email,
      updatedValue: authAppSecret,
      otp: code,
      mfaMethod,
    };

    const sessionDetails: UpdateInformationSessionValues = {
      accessToken,
      sourceIp,
      sessionId,
      persistentSessionId,
      userLanguage,
      clientSessionId: clientSessionId,
      txmaAuditEncoded: txmaAuditEncoded,
    };

    httpInstance.client.put.resolves({
      status: HTTP_STATUS_CODES.OK,
      data: mfaMethod,
    });

    const result = await updateMfaMethod(updateInput, sessionDetails);
    expect(result).to.be.true;
    expect(httpInstance.client.put.calledOnce).to.be.true;
    expect(loggerStub.called).to.be.false;
  });

  it("should return false when 404 status response when updating mfa method", async () => {
    const accessToken = "1234";
    const email = "something@test.com";
    const phoneNumber = "11111111111";
    const otp = "9876";
    const sourceIp = "0.0.0.0";
    const sessionId = "session-123";
    const persistentSessionId = "persistentsession123";
    const userLanguage = "en";

    const mfaMethod: MfaMethod = {
      mfaIdentifier: "111111",
      methodVerified: true,
      method: {
        mfaMethodType: "SMS",
        phoneNumber: "070",
      },
      priorityIdentifier: "DEFAULT",
    };

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
      clientSessionId: clientSessionId,
      txmaAuditEncoded: txmaAuditEncoded,
    };

    const problemDetail = {
      detail: "MFA Method Not Found",
      extension: { error: { code: 1056 } },
    };
    httpInstance.client.put.resolves({
      status: HTTP_STATUS_CODES.NOT_FOUND,
      data: problemDetail,
    });

    const result = await updateMfaMethod(updateInput, sessionDetails);
    expect(result).to.be.false;
    expect(httpInstance.client.put.calledOnce).to.be.true;
    expect(
      loggerStub.calledWith(
        sinon.match.has("trace", "session-123"),
        sinon.match(/MFA Method Not Found/)
      )
    ).to.be.true;
    expect(
      loggerStub.calledWith(
        sinon.match.has("trace", "session-123"),
        sinon.match(/Index: errorHandler: failed to update MFA endpoint/)
      )
    ).to.be.true;
  });

  it("should log a generic error message for errors without a response status when doing a put", async () => {
    const accessToken = "1234";
    const email = "something@test.com";
    const phoneNumber = "11111111111";
    const otp = "9876";
    const sourceIp = "0.0.0.0";
    const sessionId = "session-123";
    const persistentSessionId = "persistentsession123";
    const userLanguage = "en";

    const mfaMethod: MfaMethod = {
      mfaIdentifier: "111111",
      methodVerified: true,
      method: {
        mfaMethodType: "SMS",
        phoneNumber: "070",
      },
      priorityIdentifier: "DEFAULT",
    };

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
      clientSessionId: clientSessionId,
      txmaAuditEncoded: txmaAuditEncoded,
    };

    httpInstance.client.put.rejects(new Error("Network Error"));

    const result = await updateMfaMethod(updateInput, sessionDetails);
    expect(result).to.be.false;
    expect(httpInstance.client.put.calledOnce).to.be.true;
    expect(
      loggerStub.calledWith(
        sinon.match.has("trace", "session-123"),
        sinon.match(/Network Error/)
      )
    ).to.be.true;
    expect(
      loggerStub.calledWith(
        sinon.match.has("trace", "session-123"),
        sinon.match(/Index: errorHandler: failed to update MFA endpoint/)
      )
    ).to.be.true;
  });
});
