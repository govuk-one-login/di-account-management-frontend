import { describe, it, expect, vi, afterEach } from "vitest";
import { Http } from "../../../utils/http.js";
import { HTTP_STATUS_CODES } from "../../../app.constants.js";
import { RequestConfig } from "../../../utils/http.js";

import { deleteAccountService } from "../delete-account-service.js";

describe("deleteAccountService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("deleteAccount", () => {
    it("returns true when the API responds with NO_CONTENT", async () => {
      const fakeHttp = {
        post: vi
          .fn()
          .mockResolvedValue({ status: HTTP_STATUS_CODES.NO_CONTENT }),
      } as unknown as Http;

      const result = await deleteAccountService(fakeHttp).deleteAccount(
        "test@test.com",
        {} as RequestConfig
      );

      expect(fakeHttp.post).toHaveBeenCalledOnce();
      expect(result).toBe(true);
    });

    it("returns false when the API responds with a non-NO_CONTENT status", async () => {
      const fakeHttp = {
        post: vi
          .fn()
          .mockResolvedValue({ status: HTTP_STATUS_CODES.BAD_REQUEST }),
      } as unknown as Http;

      const result = await deleteAccountService(fakeHttp).deleteAccount(
        "test@test.com",
        {} as RequestConfig
      );

      expect(result).toBe(false);
    });
  });
});
