import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request } from "express";
import { logger } from "../logger.js";
import { dynamoClient } from "../dynamo.js";
import { ERROR_MESSAGES } from "../../app.constants.js";
import {
  getSessionStore,
  deleteExpressSession,
  destroyUserSessions,
} from "../session-store.js";

describe("session-store", () => {
  let sendStub: ReturnType<typeof vi.spyOn>;
  let loggerErrorSpy: ReturnType<typeof vi.spyOn>;
  let loggerWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    sendStub = vi.spyOn(dynamoClient, "send");
    loggerErrorSpy = vi.spyOn(logger, "error");
    loggerWarnSpy = vi.spyOn(logger, "warn");
    process.env.SESSION_STORE_TABLE_NAME = "sessions-table";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getSessionStore", () => {
    it("returns a Store-compatible object with get/set/destroy/touch", () => {
      const store = getSessionStore();

      expect(store).toHaveProperty("get");
      expect(store).toHaveProperty("set");
      expect(store).toHaveProperty("destroy");
      expect(store).toHaveProperty("touch");
    });

    it("returns the same singleton instance on repeated calls", () => {
      const first = getSessionStore();
      const second = getSessionStore();

      expect(first).toBe(second);
    });

    it("writes user_id as an extra attribute when present on the session", async () => {
      sendStub.mockResolvedValueOnce({} as any);
      const store = getSessionStore();

      await new Promise((resolve, reject) => {
        store.set(
          "abc123",
          { cookie: { maxAge: 1000 }, user_id: "user-42" } as any,
          (err) => (err ? reject(err) : resolve(undefined))
        );
      });

      const [command] = sendStub.mock.calls[0];
      expect(command.input.Item.user_id).toEqual({ S: "user-42" });
    });

    it("omits the user_id attribute when not present on the session", async () => {
      sendStub.mockResolvedValueOnce({} as any);
      const store = getSessionStore();

      await new Promise((resolve, reject) => {
        store.set("abc123", { cookie: { maxAge: 1000 } } as any, (err) =>
          err ? reject(err) : resolve(undefined)
        );
      });

      const [command] = sendStub.mock.calls[0];
      expect(command.input.Item.user_id).toBeUndefined();
    });
  });

  describe("deleteExpressSession", () => {
    it("destroys the express session", async () => {
      const destroy = vi.fn((cb: (err?: any) => void) => cb());
      const req = { session: { destroy } } as unknown as Request;

      await deleteExpressSession(req);

      expect(destroy).toHaveBeenCalledTimes(1);
      expect(loggerErrorSpy).not.toHaveBeenCalled();
    });

    it("logs an error when destroy fails", async () => {
      const failure = new Error("boom");
      const destroy = vi.fn((cb: (err?: any) => void) => cb(failure));
      const req = { session: { destroy } } as unknown as Request;

      await deleteExpressSession(req);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        ERROR_MESSAGES.FAILED_TO_DESTROY_SESSION(failure as any)
      );
    });

    it("does nothing when there is no session on the request", async () => {
      const req = {} as unknown as Request;

      await expect(deleteExpressSession(req)).resolves.toBeUndefined();
    });
  });

  describe("destroyUserSessions", () => {
    function buildRequest() {
      const destroy = vi.fn((cb: (err?: any) => void) => cb());
      return { session: { destroy } } as unknown as Request;
    }

    it("queries sessions for the subject, destroys each on the store, then destroys the express session", async () => {
      sendStub.mockResolvedValueOnce({
        Items: [
          { id: { S: "sess:session-a" } },
          { id: { S: "sess:session-b" } },
        ],
      } as any);
      const sessionStore = {
        destroy: vi.fn().mockResolvedValue(undefined),
      } as any;
      const req = buildRequest();

      await destroyUserSessions(req, "subject-1", sessionStore);

      expect(sendStub).toHaveBeenCalledTimes(1);
      const [command] = sendStub.mock.calls[0];
      expect(command.input).toEqual({
        TableName: "sessions-table",
        IndexName: "users-sessions",
        KeyConditionExpression: "user_id = :user_identifier",
        ExpressionAttributeValues: { ":user_identifier": { S: "subject-1" } },
      });

      expect(sessionStore.destroy).toHaveBeenCalledTimes(2);
      expect(sessionStore.destroy).toHaveBeenCalledWith("session-a");
      expect(sessionStore.destroy).toHaveBeenCalledWith("session-b");
      expect(req.session.destroy).toHaveBeenCalledTimes(1);
    });

    it("strips the sess: prefix from returned session ids", async () => {
      sendStub.mockResolvedValueOnce({
        Items: [{ id: { S: "sess:only-one" } }],
      } as any);
      const sessionStore = {
        destroy: vi.fn().mockResolvedValue(undefined),
      } as any;
      const req = buildRequest();

      await destroyUserSessions(req, "subject-1", sessionStore);

      expect(sessionStore.destroy).toHaveBeenCalledWith("only-one");
    });

    it("handles session ids without the sess: prefix", async () => {
      sendStub.mockResolvedValueOnce({
        Items: [{ id: { S: "no-prefix-id" } }],
      } as any);
      const sessionStore = {
        destroy: vi.fn().mockResolvedValue(undefined),
      } as any;
      const req = buildRequest();

      await destroyUserSessions(req, "subject-1", sessionStore);

      expect(sessionStore.destroy).toHaveBeenCalledWith("no-prefix-id");
    });

    it("logs a warning when some sessions fail to be destroyed, but still destroys the express session", async () => {
      sendStub.mockResolvedValueOnce({
        Items: [
          { id: { S: "sess:session-a" } },
          { id: { S: "sess:session-b" } },
        ],
      } as any);
      const sessionStore = {
        destroy: vi
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error("failed to destroy")),
      } as any;
      const req = buildRequest();

      await destroyUserSessions(req, "subject-1", sessionStore);

      expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
      expect(loggerWarnSpy.mock.calls[0][0]).toContain("1 out of 2 failed");
      expect(req.session.destroy).toHaveBeenCalledTimes(1);
    });

    it("logs an error and still destroys the express session when the query fails", async () => {
      const queryError = new Error("query failed");
      sendStub.mockRejectedValueOnce(queryError);
      const sessionStore = { destroy: vi.fn() } as any;
      const req = buildRequest();

      await destroyUserSessions(req, "subject-1", sessionStore);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Session store: failed to get sessions:")
      );
      expect(sessionStore.destroy).not.toHaveBeenCalled();
      expect(req.session.destroy).toHaveBeenCalledTimes(1);
    });

    it("returns an empty session id list when the query returns no items", async () => {
      sendStub.mockResolvedValueOnce({} as any);
      const sessionStore = { destroy: vi.fn() } as any;
      const req = buildRequest();

      await destroyUserSessions(req, "subject-1", sessionStore);

      expect(sessionStore.destroy).not.toHaveBeenCalled();
      expect(req.session.destroy).toHaveBeenCalledTimes(1);
    });

    it("logs an error and still destroys the express session when destroying sessions throws synchronously", async () => {
      sendStub.mockResolvedValueOnce({
        Items: [{ id: { S: "sess:session-a" } }],
      } as any);
      const synchronousError = new Error("synchronous failure");
      const sessionStore = {
        destroy: vi.fn(() => {
          throw synchronousError;
        }),
      } as any;
      const req = buildRequest();

      await destroyUserSessions(req, "subject-1", sessionStore);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Session store: failed to delete session(s):")
      );
      expect(req.session.destroy).toHaveBeenCalledTimes(1);
    });
  });
});
