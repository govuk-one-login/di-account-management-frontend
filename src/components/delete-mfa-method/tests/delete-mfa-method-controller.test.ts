import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { deleteMfaMethodPost } from "../delete-mfa-method-controller.js";
import { Request } from "express";
import { MfaMethod } from "../../../utils/mfaClient/types.js";
import * as mfaClient from "../../../utils/mfaClient/index.js";

describe("delete mfa method controller", () => {
  const statusFn = vi.fn();
  const redirectFn = vi.fn();

  let mfaClientStub: any;

  const mfaMethod: MfaMethod = {
    mfaIdentifier: "1",
    priorityIdentifier: "BACKUP",
    method: {
      mfaMethodType: "SMS",
      phoneNumber: "07123456789",
    },
    methodVerified: true,
  };

  const generateRequest = (idToRemove: string) => {
    return {
      session: {
        mfaMethods: [mfaMethod],
        user: {
          state: {
            removeBackup: {
              value: "CHANGE_VALUE",
            },
          },
          tokens: {
            accessToken: "accessToken",
          },
        },
      },
      body: { methodId: idToRemove },
      ip: "ip",
      log: {
        error: vi.fn(),
      },
    };
  };
  const generateResponse = () => {
    return {
      status: statusFn,
      session: {},
      redirect: redirectFn,
      locals: {
        sessionId: "sessionId",
        clientSessionId: "clientSessionId",
        persistentSessionId: "persistentSessionId",
      },
    };
  };

  beforeEach(() => {
    mfaClientStub = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      retrieve: vi.fn(),
    } as any;
    vi.spyOn(mfaClient, "createMfaClient").mockResolvedValue(mfaClientStub);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should delete an MFA method", async () => {
    const req = generateRequest("1");
    const res = generateResponse();
    mfaClientStub.delete.mockResolvedValue({
      success: true,
      status: 200,
      data: {},
    });

    //@ts-expect-error req and res aren't valid objects since they are mocked
    await deleteMfaMethodPost(req as Request, res as Response);

    expect(mfaClientStub.delete).toHaveBeenCalledWith(mfaMethod);
    expect(redirectFn).toHaveBeenCalledWith("/remove-backup-confirmation");
  });

  it("should return a 404 if a non-existent method is tried", () => {
    const req = generateRequest("2");
    const res = generateResponse();

    //@ts-expect-error req and res aren't valid objects since they are mocked
    void deleteMfaMethodPost(req as Request, res as Response);

    expect(statusFn).toHaveBeenCalledWith(404);
  });

  it("should throw an error if the API request is unsuccessful", async () => {
    const req = generateRequest("1");
    const res = generateResponse();
    mfaClientStub.delete.mockResolvedValue({
      success: false,
      status: 400,
      data: {},
      error: { message: "Bad request", code: 1 },
    });

    await expect(
      //@ts-expect-error req and res aren't valid objects since they are mocked
      deleteMfaMethodPost(req as Request, res as Response)
    ).rejects.toThrow("Bad request");
  });
});
