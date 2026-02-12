import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildContactEmailServiceUrl,
  ExpectedParams,
} from "../track-and-redirect-controller.js";
import { Request, Response } from "express";
import { logger } from "../../../utils/logger.js";
import * as config from "../../../config.js";

describe("buildContactEmailServiceUrl", () => {
  let req: Partial<Request>;
  let res: any;
  let logInfoSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.spyOn(config, "getContactEmailServiceUrl").mockReturnValue(
      "http://base.url"
    );
    req = {
      session: {
        queryParameters: {},
      },
    } as any;
    res = {
      locals: { sessionId: "session-id", trace: "trace-id" },
    };
    logInfoSpy = vi.spyOn(logger, "info");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should append expected parameters to URL", () => {
    req.session.queryParameters = {
      fromURL: "testFromURL",
      theme: "testTheme",
      appSessionId: "testAppSessionId",
      appErrorCode: "testAppErrorCode",
    };

    const result = buildContactEmailServiceUrl(req as Request, res as Response);

    for (const paramValue of Object.values(ExpectedParams)) {
      expect(result.searchParams.get(paramValue)).toBe(
        req.session.queryParameters[paramValue]
      );
    }
  });

  it("should log missing parameters", () => {
    buildContactEmailServiceUrl(req as Request, res as Response);
    expect(logInfoSpy).toHaveBeenCalledTimes(4);
    for (const paramValue of Object.values(ExpectedParams)) {
      expect(logInfoSpy).toHaveBeenCalledWith(
        { trace: "trace-id" },
        `Missing ${paramValue} in the request or session.`
      );
    }
  });
});
