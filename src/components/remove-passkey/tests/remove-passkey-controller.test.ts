import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMfaClient, MfaClient } from "../../../utils/mfaClient";
import {
  removePasskeyGet,
  removePasskeyPost,
} from "../remove-passkey-controller";
import { formatPasskeysForRender } from "../../../utils/passkeys";
import { Request, Response } from "express";
import { eventService as createEventService } from "../../../services/event-service";

vi.mock("../../../utils/mfaClient/index.js");
vi.mock("../../../utils/passkeys/index.js");
vi.mock("../../../services/event-service.js");

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
        data: {
          passkeys: [
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
        },
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
      locals: {
        opl: {},
      },
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
        data: {
          passkeys: [
            {
              id: "12345",
              lastUsedAt: "2024-01-01T00:00:00Z",
              createdAt: "2024-01-01T00:00:00Z",
              metadata: { name: "Test Passkey", aaguid: "aaguid" },
            },
          ],
        },
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
      locals: { opl: {} },
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
        data: { passkeys: [] },
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
  let mockBuildAuditEvent: ReturnType<typeof vi.fn>;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockBuildAuditEvent = vi.fn().mockReturnValue({ event_name: "test" });
    mockSend = vi.fn();
    vi.mocked(createEventService).mockReturnValue({
      buildAuditEvent: mockBuildAuditEvent,
      send: mockSend,
    } as any);
  });

  it("should delete the passkey, send HOME_PASSKEY_DELETE_SUCCESSFUL and redirect to confirmation page", async () => {
    const mfaClient: Partial<MfaClient> = {
      deletePasskey: vi.fn().mockResolvedValue({ success: true }),
    };

    vi.mocked(createMfaClient).mockResolvedValue(mfaClient as MfaClient);

    const req = {
      body: { passkeyId: "12345" },
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
    expect(mockBuildAuditEvent).toHaveBeenCalledWith(
      req,
      res,
      "HOME_PASSKEY_DELETE_SUCCESSFUL"
    );
    expect(mockSend).toHaveBeenCalledWith({ event_name: "test" }, "trace-id");
    expect(res.redirect).toHaveBeenCalledWith("/remove-passkey-confirmation");
  });

  it("should send HOME_PASSKEY_DELETE_FAILED and throw when delete passkey fails with error", async () => {
    const mfaClient: Partial<MfaClient> = {
      deletePasskey: vi.fn().mockResolvedValue({
        success: false,
        error: { message: "Failed to delete passkey" },
      }),
    };

    vi.mocked(createMfaClient).mockResolvedValue(mfaClient as MfaClient);

    const req = {
      body: { passkeyId: "12345" },
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

    expect(mockBuildAuditEvent).toHaveBeenCalledWith(
      req,
      res,
      "HOME_PASSKEY_DELETE_FAILED"
    );
    expect(mockSend).toHaveBeenCalledWith({ event_name: "test" }, "trace-id");
  });

  it("should send HOME_PASSKEY_DELETE_FAILED and throw when delete passkey fails without error object", async () => {
    const mfaClient: Partial<MfaClient> = {
      deletePasskey: vi.fn().mockResolvedValue({ success: false }),
    };

    vi.mocked(createMfaClient).mockResolvedValue(mfaClient as MfaClient);

    const req = {
      body: { passkeyId: "12345" },
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
    }).rejects.toThrow("Error deleting passkey");

    expect(mockBuildAuditEvent).toHaveBeenCalledWith(
      req,
      res,
      "HOME_PASSKEY_DELETE_FAILED"
    );
    expect(mockSend).toHaveBeenCalledWith({ event_name: "test" }, "trace-id");
  });
});
