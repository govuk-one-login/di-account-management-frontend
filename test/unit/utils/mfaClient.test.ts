import { expect } from "chai";
import { describe } from "mocha";
import sinon from "sinon";
import { Request, Response } from "express";

import {
  MfaClient,
  buildResponse,
  createMfaClient,
  formatErrorMessage,
  normalizeAuthHeader,
} from "../../../src/utils/mfaClient";
import * as loggerModule from "../../../src/utils/logger";
import {
  AuthAppMethod,
  MfaMethod,
  SimpleError,
  SmsMethod,
} from "../../../src/utils/mfaClient/types";
import {
  validateCreate,
  validateUpdate,
} from "../../../src/utils/mfaClient/validate";
import { getRequestConfig, Http } from "../../../src/utils/http";
import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import * as oidcModule from "../../../src/utils/oidc";

const mfaMethod: MfaMethod = {
  mfaIdentifier: "1234",
  methodVerified: true,
  method: {
    mfaMethodType: "SMS",
    phoneNumber: "123456789",
  } as SmsMethod,
  priorityIdentifier: "DEFAULT",
};

const backupMethod: MfaMethod = {
  mfaIdentifier: "1234",
  methodVerified: true,
  method: {
    mfaMethodType: "SMS",
    phoneNumber: "123456789",
  } as SmsMethod,
  priorityIdentifier: "DEFAULT",
};

const authAppMethod: MfaMethod = {
  mfaIdentifier: "1234",
  methodVerified: true,
  method: {
    mfaMethodType: "AUTH_APP",
    credential: "abc123",
  },
  priorityIdentifier: "BACKUP",
};

const OTP = "123456";

describe("MfaClient", () => {
  const axiosStub = {} as AxiosInstance;
  let client: MfaClient;

  beforeEach(() => {
    client = new MfaClient(
      "publicSubjectId",
      getRequestConfig({ token: "token" }),
      new Http("http://example.com", axiosStub)
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("retrieve", () => {
    it("should return a list of MfaMethods", async () => {
      const getStub = sinon.stub().resolves({ data: [mfaMethod] });
      axiosStub.get = getStub;

      const response = await client.retrieve();
      expect(response.data.length).to.eq(1);
    });

    it("should include the publicSubjectId in the URL", async () => {
      const getStub = sinon.stub().resolves({ data: [mfaMethod] });
      axiosStub.get = getStub;

      await client.retrieve();
      expect(getStub.calledWith("/mfa-methods/publicSubjectId")).to.be.true;
    });

    it("passes through the status and problem for a non-successful request", async () => {
      const error: SimpleError = { message: "user not found", code: 1 };
      const getStub = sinon.stub().resolves({ data: error, status: 404 });
      axiosStub.get = getStub;

      const response = await client.retrieve();
      expect(response.success).to.be.false;
      expect(response.status).to.eq(404);
      expect(response.error?.message).to.eq(error.message);
    });
  });

  describe("create", () => {
    it("should POST to the endpoint with an SMS app and an OTP", async () => {
      const postStub = sinon.stub().resolves({ data: backupMethod });
      axiosStub.post = postStub;

      const response = await client.create(
        {
          mfaMethodType: "SMS",
          phoneNumber: "123456",
        },
        "OTP"
      );

      expect(response.data).to.eq(backupMethod);
      expect(postStub).to.be.calledOnceWith(
        "/mfa-methods/publicSubjectId",
        {
          mfaMethod: {
            priorityIdentifier: "BACKUP",
            method: {
              mfaMethodType: "SMS",
              phoneNumber: "123456",
              otp: "OTP",
            },
          },
        },
        { headers: { Authorization: "Bearer  token" }, proxy: false }
      );
    });

    it("should POST to the endpoint with an auth app and no OTP", async () => {
      const postStub = sinon.stub().resolves({ data: authAppMethod });
      axiosStub.post = postStub;

      const response = await client.create(authAppMethod.method);

      expect(response.data).to.eq(authAppMethod);
      expect(postStub).to.be.calledOnceWith(
        "/mfa-methods/publicSubjectId",
        {
          mfaMethod: {
            priorityIdentifier: "BACKUP",
            method: authAppMethod.method,
          },
        },
        { headers: { Authorization: "Bearer  token" }, proxy: false }
      );
    });

    it("should raise an error with an SMS app and no OTP", async () => {
      const postStub = sinon.stub().resolves({ data: mfaMethod });
      axiosStub.post = postStub;

      expect(
        client.create({
          mfaMethodType: "SMS",
          phoneNumber: "123456",
        })
      ).to.be.rejected;
      expect(postStub.notCalled).to.be.true;
    });
  });

  describe("update", () => {
    it("should PUT to the endpoint with an SMS and an OTP", async () => {
      const putStub = sinon.stub().resolves({ data: [mfaMethod] });
      axiosStub.put = putStub;

      const response = await client.update(mfaMethod, OTP);

      expect(response.data.length).to.eq(1);
      expect(response.data[0]).to.eq(mfaMethod);
      expect(putStub.calledOnce).to.be.true;
    });

    it("should include the MFA id in the URL", async () => {
      const putStub = sinon.stub().resolves({ data: [mfaMethod] });
      axiosStub.put = putStub;

      await client.update(mfaMethod, OTP);

      expect(putStub.calledWith("/mfa-methods/publicSubjectId/1234")).to.be
        .true;
    });

    it("should PUT to the endpoint with an auth app and no OTP", async () => {
      const putStub = sinon.stub().resolves({ data: [authAppMethod] });
      axiosStub.put = putStub;

      const response = await client.update(authAppMethod);

      expect(response.data.length).to.eq(1);
      expect(response.data[0]).to.eq(authAppMethod);
      expect(putStub.calledOnce).to.be.true;
    });

    it("should throw an error with an auth app and an OTP", () => {
      const putStub = sinon.stub();
      axiosStub.put = putStub;

      expect(client.update(authAppMethod, OTP)).to.be.rejected;
      expect(putStub.notCalled).to.be.true;
    });

    it("should not throw an error with an SMS method and no OTP", async () => {
      const putStub = sinon.stub().resolves({ data: [mfaMethod] });
      axiosStub.put = putStub;

      const response = await client.update(mfaMethod);

      expect(response.data.length).to.eq(1);
      expect(response.data[0]).to.eq(mfaMethod);
      expect(putStub.calledOnce).to.be.true;
    });
  });

  describe("delete", () => {
    it("should DELETE to the endpoint", async () => {
      const deleteStub = sinon.stub().resolves({ status: 204, data: null });
      axiosStub.delete = deleteStub;

      await client.delete(mfaMethod);

      expect(deleteStub.calledOnce).to.be.true;
    });

    it("should include the MFA id in the URL when deleting", async () => {
      const deleteStub = sinon.stub().resolves({ status: 204, data: null });
      axiosStub.delete = deleteStub;

      await client.delete(mfaMethod);

      expect(deleteStub.calledWith("/mfa-methods/publicSubjectId/1234")).to.be
        .true;
    });
  });

  describe("makeDefault", () => {
    it("should PUT to the endpoint", async () => {
      const putStub = sinon.stub().resolves({ data: [mfaMethod] });
      axiosStub.put = putStub;

      const response = await client.makeDefault(mfaMethod.mfaIdentifier);

      expect(response.data.length).to.eq(1);
      expect(response.data[0]).to.eq(mfaMethod);
      expect(putStub.calledOnce).to.be.true;
    });

    it("should call the API and change the priority to DEFAULT", async () => {
      const putStub = sinon.stub().resolves({ data: [mfaMethod] });
      axiosStub.put = putStub;

      const backupMethod: MfaMethod = {
        ...mfaMethod,
        priorityIdentifier: "BACKUP",
      };

      await client.makeDefault(backupMethod.mfaIdentifier);

      expect(putStub).to.have.been.calledWith(
        "/mfa-methods/publicSubjectId/1234",
        { mfaMethod: { priorityIdentifier: "DEFAULT" } }
      );
    });
  });
});

describe("buildRequest", () => {
  it("returns the data when response status is 200", () => {
    const response = {
      status: 200,
      data: mfaMethod,
    } as AxiosResponse<MfaMethod>;

    const apiResponse = buildResponse(response);

    expect(response.status).to.eq(apiResponse.status);
    expect(apiResponse.success).to.be.true;
    expect(apiResponse.data).to.eq(mfaMethod);
  });

  it("returns success when response status is 204", () => {
    const response = {
      status: 204,
    } as AxiosResponse;

    const apiResponse = buildResponse(response);

    expect(apiResponse.success).to.be.true;
  });

  it("returns a ValidationProblem when response status is 400", () => {
    const response = {
      status: 400,
      data: {
        code: 1,
        message: "Bad request",
      } as SimpleError,
    } as AxiosResponse;

    const apiResponse = buildResponse(response);

    expect(apiResponse.status).to.eq(400);
    expect(apiResponse.success).to.be.false;
    expect(apiResponse.error).to.eq(response.data);
  });
});

describe("normalizeAuthHeader", () => {
  it("should return config unchanged when no headers present", () => {
    const config: AxiosRequestConfig = { proxy: false };

    const result = normalizeAuthHeader(config);

    expect(result).to.deep.eq(config);
  });

  it("should return config unchanged when no Authorization header", () => {
    const config: AxiosRequestConfig = {
      headers: { "Content-Type": "application/json" },
      proxy: false,
    };

    const result = normalizeAuthHeader(config);

    expect(result).to.deep.eq(config);
  });

  it("should handle Authorization header that starts with Bearer", () => {
    const config: AxiosRequestConfig = {
      headers: { Authorization: "Bearer abc" },
      proxy: false,
    };

    const result = normalizeAuthHeader(config);

    expect(result.headers.Authorization).to.eq("Bearer  abc");
  });

  it("should log error when Authorization header does not start with Bearer", () => {
    const loggerStub = sinon.stub(loggerModule.logger, "error");
    const config: AxiosRequestConfig = {
      headers: { Authorization: "Basic abc123" },
      proxy: false,
    };

    normalizeAuthHeader(config);

    expect(loggerStub.calledOnce).to.be.true;
    expect(loggerStub.calledWith("Authorization header must use Bearer scheme"))
      .to.be.true;
    loggerStub.restore();
  });
});

describe("createMfaClient", () => {
  beforeEach(() => {
    sinon.replace(oidcModule, "refreshToken", async () => {});
  });

  afterEach(() => {
    sinon.restore();
  });

  it("creates an MfaClient", async () => {
    const req = {
      ip: "ip",
      session: {
        user: {
          publicSubjectId: "publicSubjectId",
          tokens: { accessToken: "accessToken" },
        },
      },
      headers: { "txma-audit-encoded": "auditHeader" },
      cookies: {},
    };

    const res = {
      locals: {
        sessionId: "sessionId",
        persistentSessionID: "persistentSessionId",
        clientSessionId: "clientSessionId",
        trace: "trace",
      },
    };

    const client = await createMfaClient(
      req as unknown as Request,
      res as unknown as Response
    );

    expect(client.retrieve).to.be.a("Function");
    expect(client.create).to.be.a("Function");
    expect(client.update).to.be.a("Function");
    expect(client.delete).to.be.a("Function");
  });
});

describe("validate", () => {
  describe("validateCreate", () => {
    const smsMethod: SmsMethod = {
      mfaMethodType: "SMS",
      phoneNumber: "0123456789",
    };
    const authAppMethod: AuthAppMethod = {
      mfaMethodType: "AUTH_APP",
      credential: "abc123",
    };

    it("doesn't throw an error with an SMS method and an OTP", () => {
      expect(() => {
        validateCreate(smsMethod, "1234");
      }).not.to.throw();
    });

    it("doesn't throw an error with an auth app method and no OTP", () => {
      expect(() => {
        validateCreate(authAppMethod);
      }).not.to.throw();
    });

    it("throws an error with an auth app method and an OTP", () => {
      expect(() => {
        validateCreate(authAppMethod, "1234");
      }).to.throw("Must not provide OTP when mfaMethodType is AUTH_APP");
    });

    it("throws an error with an SMS method and no OTP", () => {
      expect(() => {
        validateCreate(smsMethod);
      }).to.throw("Must provide OTP when mfaMethodType is SMS");
    });
  });

  describe("validateUpdate", () => {
    it("throws an error when an OTP is provided with an auth app", () => {
      expect(() => {
        validateUpdate(authAppMethod, OTP);
      }).to.throw("Must only provide OTP with an SMS method update");
    });

    it("does not throw an error when an OTP is provided with an SMS method", () => {
      expect(() => {
        validateUpdate(mfaMethod, OTP);
      }).not.to.throw();
    });

    it("does not throw an error when no OTP is provided with an SMS method", () => {
      expect(() => {
        validateUpdate(mfaMethod);
      }).not.to.throw();
    });
  });
});

describe("formatErrorMessage", () => {
  it("includes the prefix, status code, API error code and message in the output", () => {
    const prefix = "Prefix";
    const response = {
      status: 400,
      error: {
        code: 1,
        message: "Bad request",
      },
      success: false,
      data: {},
    };

    expect(formatErrorMessage(prefix, response)).to.eq(
      `${prefix}. Status code: ${response.status}, API error code: ${response.error.code}, API error message: ${response.error.message}`
    );
  });
});
