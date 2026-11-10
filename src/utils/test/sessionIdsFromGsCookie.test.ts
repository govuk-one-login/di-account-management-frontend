import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request } from "express";
import {
  attachSessionIdsFromGsCookie,
  getSessionIdsFromGsCookie,
} from "../sessionIdsFromGsCookie.js";
import { LOG_MESSAGES } from "../../app.constants.js";

const { mockLoggerInfo, mockLoggerError } = vi.hoisted(() => ({
  mockLoggerInfo: vi.fn(),
  mockLoggerError: vi.fn(),
}));

vi.mock("../logger", () => ({
  logger: {
    info: (...args: any[]) => mockLoggerInfo(...args),
    error: (...args: any[]) => mockLoggerError(...args),
  },
}));

const makeReq = (gs?: string) =>
  ({ cookies: gs ? { gs } : {}, session: {} }) as unknown as Request;

const makeRes = (trace = "trace-123") =>
  ({ locals: { trace } }) as unknown as Response;

describe("attachSessionIdsFromGsCookie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs info and returns early when gs cookie is absent", () => {
    const req = makeReq();
    const res = makeRes();

    attachSessionIdsFromGsCookie(req, res);

    expect(mockLoggerInfo).toHaveBeenCalledWith(
      { trace: "trace-123" },
      LOG_MESSAGES.GS_COOKIE_NOT_IN_REQUEST
    );
    expect(mockLoggerError).not.toHaveBeenCalled();
    expect((req.session as any).authSessionIds).toBeUndefined();
  });

  it("logs error when gs cookie is malformed", () => {
    const req = makeReq("only-one-part");
    const res = makeRes();

    attachSessionIdsFromGsCookie(req, res);

    expect(mockLoggerError).toHaveBeenCalledWith(
      { trace: "trace-123" },
      LOG_MESSAGES.MALFORMED_GS_COOKIE("only-one-part")
    );
    expect((req.session as any).authSessionIds).toBeUndefined();
  });

  it("sets authSessionIds and logs cookie info when gs cookie is valid", () => {
    const req = makeReq("session-id.client-session-id");
    const res = makeRes();

    attachSessionIdsFromGsCookie(req, res);

    expect(mockLoggerInfo).toHaveBeenCalledWith(
      { trace: "trace-123" },
      "gs cookie: session-id.client-session-id"
    );
    expect(mockLoggerError).not.toHaveBeenCalled();
    expect((req.session as any).authSessionIds).toEqual({
      sessionId: "session-id",
      clientSessionId: "client-session-id",
    });
  });

  it("logs error when gs cookie has more than two parts", () => {
    const req = makeReq("a.b.c");
    const res = makeRes();

    attachSessionIdsFromGsCookie(req, res);

    expect(mockLoggerError).toHaveBeenCalledWith(
      { trace: "trace-123" },
      LOG_MESSAGES.MALFORMED_GS_COOKIE("a.b.c")
    );
    expect((req.session as any).authSessionIds).toBeUndefined();
  });
});

describe("getSessionIdsFromGsCookie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns undefined and logs info when gs cookie is absent", () => {
    const result = getSessionIdsFromGsCookie(makeReq(), makeRes());
    expect(result).toBeUndefined();
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      { trace: "trace-123" },
      LOG_MESSAGES.GS_COOKIE_NOT_IN_REQUEST
    );
  });

  it("returns undefined and logs error when gs cookie is malformed", () => {
    const result = getSessionIdsFromGsCookie(
      makeReq("only-one-part"),
      makeRes()
    );
    expect(result).toBeUndefined();
    expect(mockLoggerError).toHaveBeenCalledWith(
      { trace: "trace-123" },
      LOG_MESSAGES.MALFORMED_GS_COOKIE("only-one-part")
    );
  });

  it("returns parsed ids when gs cookie is valid", () => {
    const result = getSessionIdsFromGsCookie(
      makeReq("session-id.client-session-id"),
      makeRes()
    );
    expect(result).toEqual({
      sessionId: "session-id",
      clientSessionId: "client-session-id",
    });
  });
});
