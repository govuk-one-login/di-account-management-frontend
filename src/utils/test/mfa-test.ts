import sinon from "sinon";
import { expect } from "chai";
import { describe } from "mocha";
import { logger } from "../logger";
import * as httpModule from "../http";
import retrieveMfaMethods, { updateMfaMethod } from "../../../src/utils/mfa";
import { HTTP_STATUS_CODES } from "../../app.constants";
import { MfaMethod } from "../mfa/types";
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
        post: sinon.stub(),
        put: sinon.stub(),
      },
    };
    sinon.stub(httpModule, "Http").returns(httpInstance);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should return MFA methods on success", async () => {
    const mfaMethods = ["SMS", "EMAIL"];
    httpInstance.client.post.resolves({
      status: HTTP_STATUS_CODES.OK,
      data: mfaMethods,
    });

    const result = await retrieveMfaMethods(
      "accessToken",
      "email@example.com",
      "sourceIp",
      "sessionId",
      "persistentSessionId"
    );
    expect(result).to.deep.equal(mfaMethods);
    expect(httpInstance.client.post.calledOnce).to.be.true;
    expect(loggerStub.called).to.be.false;
  });

  it("should return an empty array when the status is not OK", async () => {
    httpInstance.client.post.resolves({
      status: HTTP_STATUS_CODES.BAD_REQUEST,
    });

    const result = await retrieveMfaMethods(
      "accessToken",
      "email@example.com",
      "sourceIp",
      "sessionId",
      "persistentSessionId"
    );
    expect(result).to.deep.equal([]);
    expect(httpInstance.client.post.calledOnce).to.be.true;
  });

  it("should log an error and return an empty array on exception", async () => {
    httpInstance.client.post.rejects(new Error("Network error"));

    const result = await retrieveMfaMethods(
      "accessToken",
      "email@example.com",
      "sourceIp",
      "sessionId",
      "persistentSessionId"
    );
    expect(result).to.deep.equal([]);
    expect(loggerStub.calledOnce).to.be.true;
    const errorCallArgs = loggerStub.getCall(0).args;
    expect(errorCallArgs[1]).to.include(
      "Failed to retrieve from MFA endpoint Network error"
    );
  });

  it("should log appropriate error for a 400 status response", async () => {
    const validationProblem = {
      title: "Validation Failed",
      errors: [{ detail: "Email is required." }],
    };
    httpInstance.client.post.rejects({
      response: {
        status: HTTP_STATUS_CODES.BAD_REQUEST,
        data: validationProblem,
      },
    });

    await retrieveMfaMethods(
      "accessToken",
      "email@example.com",
      "sourceIp",
      "sessionId",
      "persistentSessionId"
    );

    expect(
      loggerStub.calledWith(
        sinon.match.has("trace", "sessionId"),
        sinon.match(/Email is required./)
      )
    ).to.be.true;
  });

  it("should log a general error message for a 400 status response without specific errors", async () => {
    const validationProblem = {
      title: "General validation error",
    };
    httpInstance.client.post.rejects({
      response: {
        status: HTTP_STATUS_CODES.BAD_REQUEST,
        data: validationProblem,
      },
    });

    await retrieveMfaMethods(
      "accessToken",
      "email@example.com",
      "sourceIp",
      "sessionId",
      "persistentSessionId"
    );

    expect(
      loggerStub.calledWith(
        sinon.match.has("trace", "sessionId"),
        sinon.match(/General validation error/)
      )
    ).to.be.true;
  });

  it("should log appropriate error for a 404 and 500 status response", async () => {
    const problemDetail = {
      detail: "Not Found",
      extension: { error: { code: 1056 } },
    };
    httpInstance.client.post.rejects({
      response: { status: HTTP_STATUS_CODES.NOT_FOUND, data: problemDetail },
    });

    await retrieveMfaMethods(
      "accessToken",
      "email@example.com",
      "sourceIp",
      "sessionId",
      "persistentSessionId"
    );
    // Adjusting to use match with a regular expression for partial matches.
    expect(
      loggerStub.calledWith(
        sinon.match.has("trace", "sessionId"),
        sinon.match(/Not Found/)
      )
    ).to.be.true;
    expect(
      loggerStub.calledWith(
        sinon.match.has("trace", "sessionId"),
        sinon.match(/Error code: 1056/)
      )
    ).to.be.true;
  });

  it("should log a generic error message for errors without a response status", async () => {
    httpInstance.client.post.rejects(new Error("Network Error"));

    await retrieveMfaMethods(
      "accessToken",
      "email@example.com",
      "sourceIp",
      "sessionId",
      "persistentSessionId"
    );
    // Again, using match for partial matching within the error message.
    expect(
      loggerStub.calledWith(
        sinon.match.has("trace", "sessionId"),
        sinon.match(/Network Error/)
      )
    ).to.be.true;
  });

  it("should log a generic error message for unexpected status codes", async () => {
    const unexpectedError = {
      message: "Unexpected error occurred",
    };

    httpInstance.client.post.rejects({
      response: { status: HTTP_STATUS_CODES.FORBIDDEN, data: unexpectedError },
    });

    await retrieveMfaMethods(
      "accessToken",
      "email@example.com",
      "sourceIp",
      "sessionId",
      "persistentSessionId"
    );

    expect(
      loggerStub.calledWith(
        sinon.match.has("trace", "sessionId"),
        sinon.match(/Unexpected error/)
      )
    ).to.be.true;
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
      mfaIdentifier: 111111,
      methodVerified: true,
      endPoint: phoneNumber,
      mfaMethodType: "SMS",
      priorityIdentifier: "PRIMARY",
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
      mfaIdentifier: 111111,
      methodVerified: true,
      mfaMethodType: "AUTH_APP",
      priorityIdentifier: "PRIMARY",
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
      mfaIdentifier: 111111,
      methodVerified: true,
      endPoint: "PHONE",
      mfaMethodType: "SMS",
      priorityIdentifier: "PRIMARY",
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
        sinon.match(/Failed to update MFA endpoint/)
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
      mfaIdentifier: 111111,
      methodVerified: true,
      endPoint: "PHONE",
      mfaMethodType: "SMS",
      priorityIdentifier: "PRIMARY",
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
        sinon.match(/Failed to update MFA endpoint/)
      )
    ).to.be.true;
  });
});
