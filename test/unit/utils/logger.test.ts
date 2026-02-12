import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getRefererFrom, logger } from "../../../src/utils/logger.js";

describe("Logger", () => {
  beforeEach(() => {});

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getRefererFrom", () => {
    it("should return the pathname and search from a valid referer URL", () => {
      const referer = "https://www.example.com/path/to/page?query=param";
      const expectedReferer = "/path/to/page?query=param";
      expect(getRefererFrom(referer)).toBe(expectedReferer);
    });

    it("should return undefined for an invalid referer URL", () => {
      const referer = "invalid-url";
      expect(getRefererFrom(referer)).toBeUndefined();
    });

    it("should return undefined for an empty referer", () => {
      const referer = "";
      expect(getRefererFrom(referer)).toBeUndefined();
    });

    it("should return undefined for a null referer", () => {
      const referer: string = null;
      expect(getRefererFrom(referer)).toBeUndefined();
    });

    it("should handle errors when parsing an invalid referer URL", () => {
      const consoleErrorStub = vi.spyOn(console, "error");
      const invalidReferer = "http://localhost:3000/%$%^";
      const stubbedURLConstructor = vi
        .spyOn(global, "URL")
        .mockImplementation(() => {
          throw new Error("Invalid URL");
        });
      const result = getRefererFrom(invalidReferer);
      expect(result).toBeUndefined();
      expect(consoleErrorStub).toHaveBeenCalledOnce();
      expect(consoleErrorStub.mock.calls[0][0]).toContain(
        "Logger: Error obtaining referer URL"
      );
      stubbedURLConstructor.mockRestore();
    });
  });

  describe("logger instance", () => {
    it("should have correct logger name", () => {
      expect(logger.bindings().name).toBe("di-account-management-frontend");
    });

    it("should have info method", () => {
      expect(typeof logger.info).toBe("function");
    });

    it("should have error method", () => {
      expect(typeof logger.error).toBe("function");
    });
  });
});
