import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";

import {
  MfaClient,
  buildResponse,
  createMfaClient,
  formatErrorMessage,
} from "../../../src/utils/mfaClient";
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
import { AxiosInstance, AxiosResponse } from "axios";
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
    vi.restoreAllMocks();
  });

  describe("retrieve", () => {
    it("should return a list of MfaMethods", async () => {
      const getStub = vi.fn().mockResolvedValue({ data: [mfaMethod] });
      axiosStub.get = getStub;

      const response = await client.retrieve();
      expect(response.data.length).toBe(1);
    });

    it("should include the publicSubjectId in the URL", async () => {
      const getStub = vi.fn().mockResolvedValue({ data: [mfaMethod] });
      axiosStub.get = getStub;

      await client.retrieve();
      expect(getStub).toHaveBeenCalledWith(
        "/mfa-methods/publicSubjectId",
        expect.any(Object)
      );
    });

    it("passes through the status and problem for a non-successful request", async () => {
      const error: SimpleError = { message: "user not found", code: 1 };
      const getStub = vi.fn().mockResolvedValue({ data: error, status: 404 });
      axiosStub.get = getStub;

      const response = await client.retrieve();
      expect(response.success).toBe(false);
      expect(response.status).toBe(404);
      expect(response.error?.message).toBe(error.message);
    });
  });

  describe("create", () => {
    it("should POST to the endpoint with an SMS app and an OTP", async () => {
      const postStub = vi.fn().mockResolvedValue({ data: backupMethod });
      axiosStub.post = postStub;

      const response = await client.create(
        {
          mfaMethodType: "SMS",
          phoneNumber: "123456",
        },
        "OTP"
      );

      expect(response.data).toBe(backupMethod);
      expect(postStub).toHaveBeenCalledOnce();
      expect(postStub).toHaveBeenCalledWith(
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
        { headers: { Authorization: "Bearer token" }, proxy: false }
      );
    });

    it("should POST to the endpoint with an auth app and no OTP", async () => {
      const postStub = vi.fn().mockResolvedValue({ data: authAppMethod });
      axiosStub.post = postStub;

      const response = await client.create(authAppMethod.method);

      expect(response.data).toBe(authAppMethod);
      expect(postStub).toHaveBeenCalledOnce();
      expect(postStub).toHaveBeenCalledWith(
        "/mfa-methods/publicSubjectId",
        {
          mfaMethod: {
            priorityIdentifier: "BACKUP",
            method: authAppMethod.method,
          },
        },
        { headers: { Authorization: "Bearer token" }, proxy: false }
      );
    });

    it("should raise an error with an SMS app and no OTP", async () => {
      const postStub = vi.fn().mockResolvedValue({ data: mfaMethod });
      axiosStub.post = postStub;

      await expect(
        client.create({
          mfaMethodType: "SMS",
          phoneNumber: "123456",
        })
      ).rejects.toThrow();
      expect(postStub).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should PUT to the endpoint with an SMS and an OTP", async () => {
      const putStub = vi.fn().mockResolvedValue({ data: [mfaMethod] });
      axiosStub.put = putStub;

      const response = await client.update(mfaMethod, OTP);

      expect(response.data.length).toBe(1);
      expect(response.data[0]).toBe(mfaMethod);
      expect(putStub).toHaveBeenCalledOnce();
    });

    it("should include the MFA id in the URL", async () => {
      const putStub = vi.fn().mockResolvedValue({ data: [mfaMethod] });
      axiosStub.put = putStub;

      await client.update(mfaMethod, OTP);

      expect(putStub).toHaveBeenCalledWith(
        "/mfa-methods/publicSubjectId/1234",
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("should PUT to the endpoint with an auth app and no OTP", async () => {
      const putStub = vi.fn().mockResolvedValue({ data: [authAppMethod] });
      axiosStub.put = putStub;

      const response = await client.update(authAppMethod);

      expect(response.data.length).toBe(1);
      expect(response.data[0]).toBe(authAppMethod);
      expect(putStub).toHaveBeenCalledOnce();
    });

    it("should throw an error with an auth app and an OTP", async () => {
      const putStub = vi.fn();
      axiosStub.put = putStub;

      await expect(client.update(authAppMethod, OTP)).rejects.toThrow();
      expect(putStub).not.toHaveBeenCalled();
    });

    it("should not throw an error with an SMS method and no OTP", async () => {
      const putStub = vi.fn().mockResolvedValue({ data: [mfaMethod] });
      axiosStub.put = putStub;

      const response = await client.update(mfaMethod);

      expect(response.data.length).toBe(1);
      expect(response.data[0]).toBe(mfaMethod);
      expect(putStub).toHaveBeenCalledOnce();
    });
  });

  describe("delete", () => {
    it("should DELETE to the endpoint", async () => {
      const deleteStub = vi.fn().mockResolvedValue({ status: 204, data: null });
      axiosStub.delete = deleteStub;

      await client.delete(mfaMethod);

      expect(deleteStub).toHaveBeenCalledOnce();
    });

    it("should include the MFA id in the URL when deleting", async () => {
      const deleteStub = vi.fn().mockResolvedValue({ status: 204, data: null });
      axiosStub.delete = deleteStub;

      await client.delete(mfaMethod);

      expect(deleteStub).toHaveBeenCalledWith(
        "/mfa-methods/publicSubjectId/1234",
        expect.any(Object)
      );
    });
  });

  describe("makeDefault", () => {
    it("should PUT to the endpoint", async () => {
      const putStub = vi.fn().mockResolvedValue({ data: [mfaMethod] });
      axiosStub.put = putStub;

      const response = await client.makeDefault(mfaMethod.mfaIdentifier);

      expect(response.data.length).toBe(1);
      expect(response.data[0]).toBe(mfaMethod);
      expect(putStub).toHaveBeenCalledOnce();
    });

    it("should call the API and change the priority to DEFAULT", async () => {
      const putStub = vi.fn().mockResolvedValue({ data: [mfaMethod] });
      axiosStub.put = putStub;

      const backupMethod: MfaMethod = {
        ...mfaMethod,
        priorityIdentifier: "BACKUP",
      };

      await client.makeDefault(backupMethod.mfaIdentifier);

      expect(putStub).toHaveBeenCalledWith(
        "/mfa-methods/publicSubjectId/1234",
        { mfaMethod: { priorityIdentifier: "DEFAULT" } },
        expect.any(Object)
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

    expect(response.status).toBe(apiResponse.status);
    expect(apiResponse.success).toBe(true);
    expect(apiResponse.data).toBe(mfaMethod);
  });

  it("returns success when response status is 204", () => {
    const response = {
      status: 204,
    } as AxiosResponse;

    const apiResponse = buildResponse(response);

    expect(apiResponse.success).toBe(true);
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

    expect(apiResponse.status).toBe(400);
    expect(apiResponse.success).toBe(false);
    expect(apiResponse.error).toBe(response.data);
  });
});

describe("createMfaClient", () => {
  beforeEach(() => {
    vi.spyOn(oidcModule, "refreshToken").mockImplementation(async () => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

    expect(client.retrieve).toBeTypeOf("function");
    expect(client.create).toBeTypeOf("function");
    expect(client.update).toBeTypeOf("function");
    expect(client.delete).toBeTypeOf("function");
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
      }).not.toThrow();
    });

    it("doesn't throw an error with an auth app method and no OTP", () => {
      expect(() => {
        validateCreate(authAppMethod);
      }).not.toThrow();
    });

    it("throws an error with an auth app method and an OTP", () => {
      expect(() => {
        validateCreate(authAppMethod, "1234");
      }).toThrow("Must not provide OTP when mfaMethodType is AUTH_APP");
    });

    it("throws an error with an SMS method and no OTP", () => {
      expect(() => {
        validateCreate(smsMethod);
      }).toThrow("Must provide OTP when mfaMethodType is SMS");
    });
  });

  describe("validateUpdate", () => {
    it("throws an error when an OTP is provided with an auth app", () => {
      expect(() => {
        validateUpdate(authAppMethod, OTP);
      }).toThrow("Must only provide OTP with an SMS method update");
    });

    it("does not throw an error when an OTP is provided with an SMS method", () => {
      expect(() => {
        validateUpdate(mfaMethod, OTP);
      }).not.toThrow();
    });

    it("does not throw an error when no OTP is provided with an SMS method", () => {
      expect(() => {
        validateUpdate(mfaMethod);
      }).not.toThrow();
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

    expect(formatErrorMessage(prefix, response)).toBe(
      `${prefix}. Status code: ${response.status}, API error code: ${response.error.code}, API error message: ${response.error.message}`
    );
  });
});
