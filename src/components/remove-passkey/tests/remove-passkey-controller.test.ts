import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMfaClient, MfaClient } from "../../../utils/mfaClient";
import {
  removePasskeyGet,
  removePasskeyPost,
} from "../remove-passkey-controller";
import { formatPasskeysForRender } from "../../../utils/passkeys";
import { Request, Response } from "express";

vi.mock("../../../utils/mfaClient/index.js");
vi.mock("../../../utils/passkeys/index.js");

describe("removePasskeyGet", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(formatPasskeysForRender).mockImplementation(
      async (req, passkeys) => {
        return passkeys.map((passkey) => ({
          id: passkey.id,
          name: passkey.id,
          createdAt: passkey.createdAt,
          lastUsedAt: passkey.lastUsedAt,
        }));
      }
    );
  });
  it("should render remove passkey confirmation page when there is another passkey", async () => {
    const mfaClient: Partial<MfaClient> = {
      getPasskeys: vi.fn().mockResolvedValue({
        data: [
          {
            id: "12345",
            lastUsedAt: "2024-01-01T00:00:00Z",
            createdAt: "2024-01-01T00:00:00Z",
            metadata: { name: "Test Passkey", aaguid: "aaguid" },
          },
          {
            id: "67890",
            lastUsedAt: "2024-01-01T00:01:00Z",
            createdAt: "2024-01-01T00:01:00Z",
            metadata: { name: "Test Passkey 2", aaguid: "aaguid2" },
          },
        ],
      }),
    };

    vi.mocked(createMfaClient).mockResolvedValue(mfaClient as MfaClient);

    const req = {
      query: { id: "12345" },
      session: {
        mfaMethods: [],
      },
    };

    const res = {
      render: vi.fn(),
      status: vi.fn(),
    };

    await removePasskeyGet(
      req as unknown as Request,
      res as unknown as Response
    );

    expect(mfaClient.getPasskeys).toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith("remove-passkey/index.njk", {
      passkey: expect.objectContaining({ id: "12345" }),
      hasAlternativePasskey: true,
      defaultMfaType: undefined,
      phoneNumber: null,
    });
  });

  it("should render remove passkey confirmation page when there is no other passkey but there is another mfa method", async () => {
    const mfaClient: Partial<MfaClient> = {
      getPasskeys: vi.fn().mockResolvedValue({
        data: [
          {
            id: "12345",
            lastUsedAt: "2024-01-01T00:00:00Z",
            createdAt: "2024-01-01T00:00:00Z",
            metadata: { name: "Test Passkey", aaguid: "aaguid" },
          },
        ],
      }),
    };

    vi.mocked(createMfaClient).mockResolvedValue(mfaClient as MfaClient);

    const req = {
      query: { id: "12345" },
      session: {
        mfaMethods: [
          {
            method: {
              mfaMethodType: "SMS",
              phoneNumber: "+1234567890",
            },
            priorityIdentifier: "DEFAULT",
          },
        ],
      },
    };

    const res = {
      render: vi.fn(),
      status: vi.fn(),
    };

    await removePasskeyGet(
      req as unknown as Request,
      res as unknown as Response
    );

    expect(mfaClient.getPasskeys).toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith("remove-passkey/index.njk", {
      passkey: expect.objectContaining({ id: "12345" }),
      hasAlternativePasskey: false,
      defaultMfaType: "SMS",
      phoneNumber: "7890",
    });
  });

  it("should return 404 when passkey is not found", async () => {
    const mfaClient: Partial<MfaClient> = {
      getPasskeys: vi.fn().mockResolvedValue({
        data: [],
      }),
    };

    vi.mocked(createMfaClient).mockResolvedValue(mfaClient as MfaClient);

    const req = {
      query: { id: "12345" },
      session: {
        mfaMethods: [],
      },
    };

    const res = {
      render: vi.fn(),
      status: vi.fn(),
    };

    await removePasskeyGet(
      req as unknown as Request,
      res as unknown as Response
    );

    expect(mfaClient.getPasskeys).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("removePasskeyPost", () => {
  it("should delete the passkey and redirect to confirmation page", async () => {
    const mfaClient: Partial<MfaClient> = {
      deletePasskey: vi.fn().mockResolvedValue({ success: true }),
    };

    vi.mocked(createMfaClient).mockResolvedValue(mfaClient as MfaClient);

    const req = {
      body: { id: "12345" },
      session: {
        user: {
          state: {
            removePasskey: { value: "CONFIRMATION" },
          },
        },
      },
    };

    const res = {
      redirect: vi.fn(),
      locals: { trace: "trace-id" },
    };

    await removePasskeyPost(
      req as unknown as Request,
      res as unknown as Response
    );

    expect(mfaClient.deletePasskey).toHaveBeenCalledWith("12345");
    expect(res.redirect).toHaveBeenCalledWith("/remove-passkey-confirmation");
  });

  it("should log an error when delete passkey fails", async () => {
    const mfaClient: Partial<MfaClient> = {
      deletePasskey: vi.fn().mockResolvedValue({
        success: false,
        error: { message: "Failed to delete passkey" },
      }),
    };

    vi.mocked(createMfaClient).mockResolvedValue(mfaClient as MfaClient);

    const req = {
      body: { id: "12345" },
      session: {
        user: {
          state: {
            removePasskey: { value: "CONFIRMATION" },
          },
        },
      },
      log: { error: vi.fn() },
    };

    const res = {
      redirect: vi.fn(),
      locals: { trace: "trace-id" },
    };

    await expect(async () => {
      await removePasskeyPost(
        req as unknown as Request,
        res as unknown as Response
      );
    }).rejects.toThrow("Failed to delete passkey");

    expect(mfaClient.deletePasskey).toHaveBeenCalledWith("12345");
  });
});
