import { describe, it, expect, vi, afterEach } from "vitest";
import { attachSessionIdsFromGsCookie } from "../attachSessionIdsFromGsCookie.js";
import { logger } from "../logger.js";

describe("attachSessionIdsFromGsCookie", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs warning if gs cookie is malformed", () => {
    const loggerInfo = vi.spyOn(logger, "info");
    const loggerError = vi.spyOn(logger, "error");

    const req: any = {
      cookies: {
        gs: "malformed-cookie",
      },
      session: {},
    };

    attachSessionIdsFromGsCookie(req);

    expect(loggerInfo).toHaveBeenCalled();
    expect(loggerError).toHaveBeenCalledOnce();
    expect(req.session.authSessionIds).toBeUndefined();
  });

  it("sets session.authSessionIds when cookie is valid", () => {
    const loggerInfo = vi.spyOn(logger, "info");
    const req: any = {
      cookies: {
        gs: "sess123.client456",
      },
      session: {},
    };

    attachSessionIdsFromGsCookie(req);

    expect(loggerInfo).toHaveBeenCalledOnce();
    expect(req.session.authSessionIds).toEqual({
      sessionId: "sess123",
      clientSessionId: "client456",
    });
  });

  it("logs info if gs cookie is missing", () => {
    const loggerInfo = vi.spyOn(logger, "info");

    const req: any = {
      cookies: {},
      session: {},
    };

    attachSessionIdsFromGsCookie(req);

    expect(loggerInfo).toHaveBeenCalledOnce();
  });
});
