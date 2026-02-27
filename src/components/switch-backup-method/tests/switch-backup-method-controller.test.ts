import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  switchBackupMfaMethodPost,
  switchBackupMfaMethodGet,
} from "../switch-backup-method-controller.js";
import * as mfaClient from "../../../utils/mfaClient/index.js";
import { MfaMethod } from "../../../utils/mfaClient/types";

describe("change default method", () => {
  const statusFn = vi.fn();
  const redirectFn = vi.fn();

  const generateRequest = (id: string, noBackup = true, noDefault = true) => {
    const mfaMethods: any[] = [];
    if (!noBackup) {
      mfaMethods.push({
        mfaIdentifier: 1,
        priorityIdentifier: "BACKUP",
        method: {
          mfaMethodType: "AUTH_APP",
        },
      });
    }
    if (!noDefault) {
      mfaMethods.push({
        mfaIdentifier: 2,
        priorityIdentifier: "DEFAULT",
        method: {
          mfaMethodType: "SMS",
          phoneNumber: "12345678",
        },
      });
    }
    return {
      session: {
        mfaMethods,
        user: {
          state: {
            switchBackupMethod: {
              value: "CHANGE_VALUE",
            },
          },
        },
      },
      body: { newDefault: id },
    };
  };
  const generateResponse = () => {
    return {
      status: statusFn,
      session: {},
      redirect: redirectFn,
      locals: {},
    };
  };

  describe("GET", () => {
    it("should return a 404 if there is no backup method", async () => {
      const req = generateRequest("1", true);
      const res = generateResponse();

      //@ts-expect-error req and res aren't valid objects since they are mocked
      await switchBackupMfaMethodGet(req as Request, res as Response);

      expect(statusFn).toHaveBeenCalledWith(404);
    });

    it("should return a 404 if there is no default method", async () => {
      const req = generateRequest("1", false, true);
      const res = generateResponse();

      //@ts-expect-error req and res aren't valid objects since they are mocked
      await switchBackupMfaMethodGet(req as Request, res as Response);

      expect(statusFn).toHaveBeenCalledWith(404);
    });
  });

  describe("POST", () => {
    let mfaClientStub: any;

    const appMethod = {
      mfaMethodType: "AUTH_APP" as const,
      credential: "test-credential",
    };

    const mfaMethod: MfaMethod = {
      mfaIdentifier: "1",
      priorityIdentifier: "BACKUP",
      methodVerified: true,
      method: appMethod,
    };

    beforeEach(() => {
      mfaClientStub = {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        retrieve: vi.fn(),
        makeDefault: vi.fn(),
      } as any;
      vi.spyOn(mfaClient, "createMfaClient").mockResolvedValue(mfaClientStub);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should change the DEFAULT MFA method", async () => {
      const req = {
        session: {
          mfaMethods: [
            mfaMethod,
            { ...mfaMethod, priorityIdentifier: "DEFAULT", mfaIdentifier: "2" },
          ],
          user: {
            state: {
              switchBackupMethod: {
                value: "CHANGE_VALUE",
              },
            },
          },
        },
        body: { newDefault: mfaMethod.mfaIdentifier },
      };
      const res = generateResponse();

      mfaClientStub.makeDefault.mockResolvedValue({
        data: [mfaMethod],
        success: true,
        status: 200,
      });

      //@ts-expect-error req and res aren't valid objects since they are mocked
      await switchBackupMfaMethodPost(req as Request, res as Response);

      expect(mfaClientStub.makeDefault).toHaveBeenCalledWith(
        mfaMethod.mfaIdentifier
      );
      expect(redirectFn).toHaveBeenCalledWith("/switch-methods-confirmation");
    });

    it("should return a 404 if the new default method doesn't exist", async () => {
      const req = generateRequest("5", false);
      const res = generateResponse();

      //@ts-expect-error req and res aren't valid objects since they are mocked
      await switchBackupMfaMethodPost(req as Request, res as Response);

      expect(statusFn).toHaveBeenCalledWith(404);
    });

    it("should throw an error if the request to the API fails", async () => {
      mfaClientStub.makeDefault.mockResolvedValue({
        data: [mfaMethod],
        success: false,
        status: 500,
        error: { message: "Internal server error", code: 1 },
      });

      const req = generateRequest("1", false);
      const res = generateResponse();

      await expect(
        //@ts-expect-error req and res aren't valid objects since they are mocked
        switchBackupMfaMethodPost(req, res)
      ).rejects.toThrow(
        "Switch backup method controller: error updating default MFA method. Status code: 500, API error code: 1, API error message: Internal server error"
      );
    });
  });
});
