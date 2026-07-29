import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response as ExpressResponse } from "express";

import {
  MfaClient,
  buildResponse,
  createMfaClient,
  formatErrorMessage,
} from "../../../src/utils/mfaClient";
import {
  AuthAppMethod,
  MfaMethod,
  Passkey,
  SmsMethod,
} from "../../../src/utils/mfaClient/types";
import {
  validateCreate,
  validateUpdate,
} from "../../../src/utils/mfaClient/validate";
import { Http } from "../../../src/utils/http";
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

const passkey: Passkey = {
  credential: "credential123",
  id: "passkey-id-123",
  aaguid: "aaguid-123",
  isAttested: true,
  signCount: 5,
  transports: ["usb", "nfc"],
  isBackUpEligible: true,
  isBackedUp: false,
  isResidentKey: true,
  createdAt: "2023-01-01T00:00:00Z",
  lastUsedAt: "2023-01-02T00:00:00Z",
};

describe("MfaClient", () => {
  let mockHttp: Http;
  let client: MfaClient;

  beforeEach(() => {
    mockHttp = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as Http;

    client = new MfaClient(
      "publicSubjectId",
      { headers: { Authorization: "Bearer token" } } as any,
      mockHttp
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("retrieve", () => {
    it("should return a list of MfaMethods", async () => {
      vi.mocked(mockHttp.get).mockResolvedValue({
        status: 200,
        ok: true,
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue([mfaMethod]),
        }),
        json: vi.fn().mockResolvedValue([mfaMethod]),
      } as unknown as Response);

      const response = await client.retrieve();

      expect(response.data.length).toBe(1);
    });

    it("should include the publicSubjectId in the URL", async () => {
      vi.mocked(mockHttp.get).mockResolvedValue({
        status: 200,
        ok: true,
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue([mfaMethod]),
        }),
        json: vi.fn().mockResolvedValue([mfaMethod]),
      } as unknown as Response);

      await client.retrieve();

      expect(mockHttp.get).toHaveBeenCalledWith(
        "/mfa-methods/publicSubjectId",
        expect.any(Object)
      );
    });

    it("passes through the status and problem for a non-successful request", async () => {
      const error = { message: "user not found", code: 1 };

      vi.mocked(mockHttp.get).mockResolvedValue({
        status: 404,
        ok: false,
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue(error),
        }),
        json: vi.fn().mockResolvedValue(error),
      } as unknown as Response);

      const response = await client.retrieve();

      expect(response.success).toBe(false);
      expect(response.status).toBe(404);
      expect(response.error?.message).toBe(error.message);
    });
  });

  describe("create", () => {
    it("should POST to the endpoint with an SMS app and an OTP", async () => {
      vi.mocked(mockHttp.post).mockResolvedValue({
        status: 200,
        ok: true,
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue(backupMethod),
        }),
        json: vi.fn().mockResolvedValue(backupMethod),
      } as unknown as Response);

      const response = await client.create(
        {
          mfaMethodType: "SMS",
          phoneNumber: "123456",
        },
        "OTP"
      );

      expect(response.data).toEqual(backupMethod);
      expect(mockHttp.post).toHaveBeenCalledOnce();
      expect(mockHttp.post).toHaveBeenCalledWith(
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
        expect.any(Object)
      );
    });

    it("should POST to the endpoint with an auth app and no OTP", async () => {
      vi.mocked(mockHttp.post).mockResolvedValue({
        status: 200,
        ok: true,
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue(authAppMethod),
        }),
        json: vi.fn().mockResolvedValue(authAppMethod),
      } as unknown as Response);

      const response = await client.create(authAppMethod.method);

      expect(response.data).toEqual(authAppMethod);
      expect(mockHttp.post).toHaveBeenCalledOnce();
      expect(mockHttp.post).toHaveBeenCalledWith(
        "/mfa-methods/publicSubjectId",
        {
          mfaMethod: {
            priorityIdentifier: "BACKUP",
            method: authAppMethod.method,
          },
        },
        expect.any(Object)
      );
    });

    it("should raise an error with an SMS app and no OTP", async () => {
      vi.mocked(mockHttp.post).mockResolvedValue({
        status: 200,
        ok: true,
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue(mfaMethod),
        }),
        json: vi.fn().mockResolvedValue(mfaMethod),
      } as unknown as Response);

      await expect(
        client.create({
          mfaMethodType: "SMS",
          phoneNumber: "123456",
        })
      ).rejects.toThrow();
      expect(mockHttp.post).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should PUT to the endpoint with an SMS and an OTP", async () => {
      vi.mocked(mockHttp.put).mockResolvedValue({
        status: 200,
        ok: true,
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue([mfaMethod]),
        }),
        json: vi.fn().mockResolvedValue([mfaMethod]),
      } as unknown as Response);

      const response = await client.update(mfaMethod, OTP);

      expect(response.data.length).toBe(1);
      expect(response.data[0]).toEqual(mfaMethod);
      expect(mockHttp.put).toHaveBeenCalledOnce();
    });

    it("should include the MFA id in the URL", async () => {
      vi.mocked(mockHttp.put).mockResolvedValue({
        status: 200,
        ok: true,
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue([mfaMethod]),
        }),
        json: vi.fn().mockResolvedValue([mfaMethod]),
      } as unknown as Response);

      await client.update(mfaMethod, OTP);

      expect(mockHttp.put).toHaveBeenCalledWith(
        "/mfa-methods/publicSubjectId/1234",
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("should PUT to the endpoint with an auth app and no OTP", async () => {
      vi.mocked(mockHttp.put).mockResolvedValue({
        status: 200,
        ok: true,
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue([authAppMethod]),
        }),
        json: vi.fn().mockResolvedValue([authAppMethod]),
      } as unknown as Response);

      const response = await client.update(authAppMethod);

      expect(response.data.length).toBe(1);
      expect(response.data[0]).toEqual(authAppMethod);
      expect(mockHttp.put).toHaveBeenCalledOnce();
    });

    it("should throw an error with an auth app and an OTP", async () => {
      await expect(client.update(authAppMethod, OTP)).rejects.toThrow();
      expect(mockHttp.put).not.toHaveBeenCalled();
    });

    it("should not throw an error with an SMS method and no OTP", async () => {
      vi.mocked(mockHttp.put).mockResolvedValue({
        status: 200,
        ok: true,
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue([mfaMethod]),
        }),
        json: vi.fn().mockResolvedValue([mfaMethod]),
      } as unknown as Response);

      const response = await client.update(mfaMethod);

      expect(response.data.length).toBe(1);
      expect(response.data[0]).toEqual(mfaMethod);
      expect(mockHttp.put).toHaveBeenCalledOnce();
    });
  });

  describe("delete", () => {
    it("should DELETE to the endpoint", async () => {
      vi.mocked(mockHttp.delete).mockResolvedValue({
        status: 204,
        ok: true,
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue(null),
        }),
        json: vi.fn().mockResolvedValue(null),
      } as unknown as Response);

      await client.delete(mfaMethod);

      expect(mockHttp.delete).toHaveBeenCalledOnce();
    });

    it("should include the MFA id in the URL when deleting", async () => {
      vi.mocked(mockHttp.delete).mockResolvedValue({
        status: 204,
        ok: true,
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue(null),
        }),
        json: vi.fn().mockResolvedValue(null),
      } as unknown as Response);

      await client.delete(mfaMethod);

      expect(mockHttp.delete).toHaveBeenCalledWith(
        "/mfa-methods/publicSubjectId/1234",
        expect.any(Object)
      );
    });
  });

  describe("makeDefault", () => {
    it("should PUT to the endpoint", async () => {
      vi.mocked(mockHttp.put).mockResolvedValue({
        status: 200,
        ok: true,
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue([mfaMethod]),
        }),
        json: vi.fn().mockResolvedValue([mfaMethod]),
      } as unknown as Response);

      const response = await client.makeDefault(mfaMethod.mfaIdentifier);

      expect(response.data.length).toBe(1);
      expect(response.data[0]).toEqual(mfaMethod);
      expect(mockHttp.put).toHaveBeenCalledOnce();
    });

    it("should call the API and change the priority to DEFAULT", async () => {
      vi.mocked(mockHttp.put).mockResolvedValue({
        status: 200,
        ok: true,
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue([mfaMethod]),
        }),
        json: vi.fn().mockResolvedValue([mfaMethod]),
      } as unknown as Response);

      const backupMethod = {
        ...mfaMethod,
        priorityIdentifier: "BACKUP",
      };

      await client.makeDefault(backupMethod.mfaIdentifier);

      expect(mockHttp.put).toHaveBeenCalledWith(
        "/mfa-methods/publicSubjectId/1234",
        { mfaMethod: { priorityIdentifier: "DEFAULT" } },
        expect.any(Object)
      );
    });
  });

  describe("getPasskeys", () => {
    it("should GET passkeys from the endpoint", async () => {
      vi.mocked(mockHttp.get).mockResolvedValue({
        status: 200,
        ok: true,
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue([passkey]),
        }),
        json: vi.fn().mockResolvedValue([passkey]),
      } as unknown as Response);

      const response = await client.getPasskeys();

      expect(response.data[0]).toBe(passkey);

      expect(mockHttp.get).toHaveBeenCalledWith(
        "/passkeys/publicSubjectId",
        expect.any(Object)
      );
    });
  });

  describe("deletePasskey", () => {
    it("should DELETE passkey from the endpoint", async () => {
      vi.mocked(mockHttp.delete).mockResolvedValue({
        status: 204,
        ok: true,
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue(null),
        }),
        json: vi.fn().mockResolvedValue(null),
      } as unknown as Response);

      await client.deletePasskey("passkey-id-123");

      expect(mockHttp.delete).toHaveBeenCalledWith(
        "/passkeys/publicSubjectId/passkey-id-123",
        expect.any(Object)
      );
    });
  });
});

describe("buildResponse", () => {
  const createMockResponse = (status: number, dataPayload?: any) => {
    return {
      status,
      ok: status >= 200 && status < 300,
      clone: vi.fn().mockReturnValue({
        json: vi.fn().mockResolvedValue(dataPayload),
        text: vi
          .fn()
          .mockResolvedValue(
            typeof dataPayload === "string"
              ? dataPayload
              : JSON.stringify(dataPayload)
          ),
      }),
      json: vi.fn().mockResolvedValue(dataPayload),
      text: vi
        .fn()
        .mockResolvedValue(
          typeof dataPayload === "string"
            ? dataPayload
            : JSON.stringify(dataPayload)
        ),
    } as unknown as globalThis.Response;
  };

  it("returns the data when response status is 200", async () => {
    const response = createMockResponse(200, mfaMethod);

    const apiResponse = await buildResponse(response);

    expect(response.status).toBe(apiResponse.status);
    expect(apiResponse.success).toBe(true);
    expect(apiResponse.data).toEqual(mfaMethod);
  });

  it("returns success when response status is 204", async () => {
    const response = createMockResponse(204);

    const apiResponse = await buildResponse(response);

    expect(apiResponse.success).toBe(true);
  });

  it("returns a ValidationProblem when response status is 400", async () => {
    const errorPayload = {
      code: 1,
      message: "Bad request",
    };
    const response = createMockResponse(400, errorPayload);

    const apiResponse = await buildResponse(response);

    expect(apiResponse.status).toBe(400);
    expect(apiResponse.success).toBe(false);
    expect(apiResponse.error).toEqual(errorPayload);
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
      res as unknown as ExpressResponse
    );

    expect(client.retrieve).toBeTypeOf("function");
    expect(client.create).toBeTypeOf("function");
    expect(client.update).toBeTypeOf("function");
    expect(client.delete).toBeTypeOf("function");
    expect(client.getPasskeys).toBeTypeOf("function");
    expect(client.deletePasskey).toBeTypeOf("function");
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
