import { describe, it, expect } from "vitest";
import { ApiError, BadRequestError } from "../../../src/utils/errors.js";

describe("errors", () => {
  describe("ApiError", () => {
    it("should create ApiError with message only", () => {
      const error = new ApiError("Test error message");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe("Test error message");
    });

    it("should create ApiError with message and status", () => {
      const error = new ApiError("Test error message", 500);

      expect(error.message).toBe("Test error message");
      expect((error as any).status).toBe(500);
    });

    it("should create ApiError with message, status, and data", () => {
      const error = new ApiError("Test error message", 404, "Not found data");

      expect(error.message).toBe("Test error message");
      expect((error as any).status).toBe(404);
      expect((error as any).data).toBe("Not found data");
    });

    it("should handle different status codes", () => {
      const error400 = new ApiError("Bad request", 400);
      const error401 = new ApiError("Unauthorized", 401);
      const error403 = new ApiError("Forbidden", 403);
      const error500 = new ApiError("Internal error", 500);

      expect((error400 as any).status).toBe(400);
      expect((error401 as any).status).toBe(401);
      expect((error403 as any).status).toBe(403);
      expect((error500 as any).status).toBe(500);
    });

    it("should handle undefined status and data", () => {
      const error = new ApiError("Test error");

      expect((error as any).status).toBeUndefined();
      expect((error as any).data).toBeUndefined();
    });

    it("should preserve error stack trace", () => {
      const error = new ApiError("Test error", 500);

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe("string");
    });
  });

  describe("BadRequestError", () => {
    it("should create BadRequestError with message and numeric code", () => {
      const error = new BadRequestError("Invalid input", 1001);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toBe("1001:Invalid input");
      expect((error as any).status).toBe(400);
    });

    it("should create BadRequestError with message and string code", () => {
      const error = new BadRequestError("Invalid input", "ERR_INVALID");

      expect(error.message).toBe("ERR_INVALID:Invalid input");
      expect((error as any).status).toBe(400);
    });

    it("should always set status to 400", () => {
      const error1 = new BadRequestError("Error 1", 1001);
      const error2 = new BadRequestError("Error 2", "CODE");

      expect((error1 as any).status).toBe(400);
      expect((error2 as any).status).toBe(400);
    });

    it("should format message with code prefix", () => {
      const error = new BadRequestError("Validation failed", 2000);

      expect(error.message).toBe("2000:Validation failed");
    });

    it("should handle empty message", () => {
      const error = new BadRequestError("", 1001);

      expect(error.message).toBe("1001:");
    });

    it("should handle zero as code", () => {
      const error = new BadRequestError("Test error", 0);

      expect(error.message).toBe("0:Test error");
      expect((error as any).status).toBe(400);
    });

    it("should preserve error stack trace", () => {
      const error = new BadRequestError("Test error", 1001);

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe("string");
    });
  });
});
