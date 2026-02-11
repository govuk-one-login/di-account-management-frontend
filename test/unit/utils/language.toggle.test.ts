import { describe, it, expect, beforeEach } from "vitest";
import { getCurrentUrl } from "../../../src/utils/language-toggle.js";
import { Request } from "express";

describe("getCurrentUrl", () => {
  let req: Partial<Request>;

  beforeEach(() => {
    req = {
      protocol: "https",
      originalUrl: "/test-path",
      get: (headerName: string) => {
        return headerName === "host" ? "example.com" : undefined;
      },
    } as Partial<Request>;
  });

  it("should return the current URL", () => {
    // Call the function
    const url = getCurrentUrl(req as Request);

    // Check the result
    expect(url.href).toBe("https://example.com/test-path");
  });
});
