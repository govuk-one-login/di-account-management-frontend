import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request } from "express";

import { logger } from "../../utils/logger.js";
import { getTxmaHeader } from "../txma-header.js";

describe("getTxmaHeader", () => {
  const TRACE = "trace";
  let loggerWarnSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    loggerWarnSpy = vi.spyOn(logger, "warn");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the header value when the header is present", () => {
    const TXMA_HEADER_VALUE = "TXMA_HEADER_VALUE";
    const request: Partial<Request> = {
      headers: {
        "txma-audit-encoded": TXMA_HEADER_VALUE,
      },
    };

    const result = getTxmaHeader(request as Request, TRACE);

    expect(result).toBe(TXMA_HEADER_VALUE);
    expect(loggerWarnSpy).not.toHaveBeenCalled();
  });

  it("returns an empty string when the header is not present", () => {
    const request: Partial<Request> = {
      headers: {
        "a-different-header": "a-different-value",
      },
    };

    const result = getTxmaHeader(request as Request, TRACE);

    expect(result).toBeUndefined();
    expect(loggerWarnSpy).toHaveBeenCalledOnce();
  });
});
