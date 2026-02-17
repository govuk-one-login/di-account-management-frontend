import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SnsService } from "../../../utils/types";
import { http } from "../../../utils/http.js";

import { deleteAccountService } from "../delete-account-service.js";

describe("deleteAccountService", () => {
  beforeEach(() => {
    process.env.DELETE_TOPIC_ARN = "UserAccountDeletionEnv";
  });

  afterEach(() => {
    delete process.env.DELETE_TOPIC_ARN;
    vi.restoreAllMocks();
  });

  describe("deleteServiceData", () => {
    const expected_message = JSON.stringify({
      user_id: "abc",
      public_subject_id: "def",
    });

    it("fills the topic ARN from config if not provided", async () => {
      const fakeSnsService: SnsService = { publish: vi.fn() };
      await deleteAccountService(http, fakeSnsService).publishToDeleteTopic(
        "abc",
        "def"
      );
      expect(fakeSnsService.publish).toHaveBeenCalledOnce();
      expect(fakeSnsService.publish).toHaveBeenCalledWith(
        "UserAccountDeletionEnv",
        expected_message
      );
    });

    it("calls snsService.publish with a topic ARN and message JSON", async () => {
      const fakeSnsService: SnsService = { publish: vi.fn() };
      await deleteAccountService(http, fakeSnsService).publishToDeleteTopic(
        "abc",
        "def",
        undefined,
        "UserAccountDeletion"
      );
      expect(fakeSnsService.publish).toHaveBeenCalledOnce();
      expect(fakeSnsService.publish).toHaveBeenCalledWith(
        "UserAccountDeletion",
        expected_message
      );
    });
  });
});
