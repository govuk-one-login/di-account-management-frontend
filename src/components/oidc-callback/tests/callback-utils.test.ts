import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  determineRedirectUri,
  COOKIE_CONSENT,
  handleOidcCallbackError,
  populateSessionWithUserInfo,
  attachSessionIdsFromGsCookie,
  generateTokenSet,
} from "../call-back-utils";
import { PATH_DATA } from "../../../app.constants";
import * as sessionStore from "../../../utils/session-store.js";
import { logger } from "../../../utils/logger.js";
import { TokenSet } from "openid-client";

describe("callback-utils", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("generateTokenSet", () => {
    let req: any;
    let callbackStub: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      const mockTokenSet = {
        access_token: "fake-access-token",
        id_token: "fake-id-token",
      } as TokenSet;

      callbackStub = vi.fn().mockResolvedValue(mockTokenSet);

      req = {
        oidc: {
          metadata: {
            redirect_uris: ["http://localhost/callback"],
          },
          callback: callbackStub,
        },
        session: {
          nonce: "mock-nonce",
          state: "mock-state",
        },
      } as any;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should call oidc.callback with correct arguments and return the token set", async () => {
      const queryParams = {
        code: "fake-code",
        state: "mock-state",
      };

      const clientAssertion = "mock-client-assertion";

      const tokenSet = await generateTokenSet(
        req,
        queryParams,
        clientAssertion
      );

      expect(callbackStub).toHaveBeenCalledOnce();
      expect(callbackStub.mock.calls[0][0]).toBe("http://localhost/callback");
      expect(callbackStub.mock.calls[0][1]).toEqual(queryParams);
      expect(callbackStub.mock.calls[0][2]).toEqual({
        nonce: "mock-nonce",
        state: "mock-state",
      });
      expect(callbackStub.mock.calls[0][3]).toEqual({
        exchangeBody: {
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion: clientAssertion,
        },
      });

      expect(tokenSet).toHaveProperty("access_token", "fake-access-token");
      expect(tokenSet).toHaveProperty("id_token", "fake-id-token");
    });
  });

  describe("determineRedirectUri", () => {
    it("should return currentURL from session if available", () => {
      const req: any = {
        session: { currentURL: "/dashboard" },
        query: {},
      };
      const result = determineRedirectUri(req);
      expect(result).toBe("/dashboard");
    });

    it("should return default path if currentURL not set", () => {
      const req: any = {
        session: {},
        query: {},
      };
      const result = determineRedirectUri(req);
      expect(result).toBe(PATH_DATA.YOUR_SERVICES.url);
    });

    it("should return default path if session is null", () => {
      const req: any = {
        query: {},
      };
      const result = determineRedirectUri(req);
      expect(result).toBe(PATH_DATA.YOUR_SERVICES.url);
    });

    it("should append _ga param to redirect URL if consent is accepted", () => {
      const req: any = {
        session: {},
        query: {
          cookie_consent: COOKIE_CONSENT.ACCEPT,
          _ga: "GA1.2.123456",
        },
      };
      const result = determineRedirectUri(req);
      expect(result).toBe(`${PATH_DATA.YOUR_SERVICES.url}?_ga=GA1.2.123456`);
    });

    it("should not append _ga if consent is not ACCEPT", () => {
      const req: any = {
        session: {},
        query: {
          cookie_consent: COOKIE_CONSENT.REJECT,
          _ga: "GA1.2.123456",
        },
      };
      const result = determineRedirectUri(req);
      expect(result).toBe(PATH_DATA.YOUR_SERVICES.url);
    });
  });

  describe("handleOidcCallbackError", () => {
    it("clears session and redirects to SESSION_EXPIRED", async () => {
      const deleteExpressSessionStub = vi.spyOn(
        sessionStore,
        "deleteExpressSession"
      );
      const loggerWarnStub = vi.spyOn(logger, "warn");

      const req: any = {
        session: { destroy: vi.fn((cb) => cb()) },
        oidc: {},
        cookies: {},
      };
      const res: any = {
        locals: { trace: "trace-id" },
        redirect: vi.fn(),
      };
      const queryParams = {
        error: "access_denied",
        error_description: "User denied access",
      };

      await handleOidcCallbackError(req, res, queryParams);

      expect(loggerWarnStub).toHaveBeenCalledOnce();
      expect(deleteExpressSessionStub).toHaveBeenCalledWith(req);
      expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.SESSION_EXPIRED.url);
    });

    it("clears session and redirects to UNAVAILABLE_TEMPORARY", async () => {
      const deleteExpressSessionStub = vi.spyOn(
        sessionStore,
        "deleteExpressSession"
      );
      const loggerWarnStub = vi.spyOn(logger, "warn");

      const req: any = {
        session: { destroy: vi.fn((cb) => cb()) },
        oidc: {},
        cookies: {},
      };
      const res: any = {
        locals: { trace: "trace-id" },
        redirect: vi.fn(),
      };

      const queryParams = {
        error: "temporarily_unavailable",
        error_description:
          "The authorization server is temporarily unavailable",
      };

      await handleOidcCallbackError(req, res, queryParams);

      expect(loggerWarnStub).toHaveBeenCalledOnce();
      expect(deleteExpressSessionStub).toHaveBeenCalledWith(req);
      expect(res.redirect).toHaveBeenCalledWith(
        PATH_DATA.UNAVAILABLE_TEMPORARY.url
      );
    });
  });

  describe("populateSessionWithUserInfo", () => {
    it("stores user info and tokens in session", () => {
      const req: any = {
        session: {},
      };
      const userInfo = {
        email: "user@example.com",
        phone_number: "1234567890",
        phone_number_verified: true,
        sub: "subject123",
        legacy_subject_id: "legacy123",
        public_subject_id: "public123",
      };

      const tokenSet = {
        id_token: "id.token",
        access_token: "access.token",
        refresh_token: "refresh.token",
      };

      populateSessionWithUserInfo(req, userInfo as any, tokenSet as any);

      expect(req.session.user.email).toBe("user@example.com");
      expect(req.session.user.tokens.accessToken).toBe("access.token");
      expect(req.session.user.legacySubjectId).toBe("legacy123");
    });
  });

  describe("attachSessionIdsFromGsCookie", () => {
    it("logs warning if gs cookie is malformed", () => {
      const loggerInfo = vi.spyOn(logger, "info");
      const loggerError = vi.spyOn(logger, "error");

      const req: any = {
        cookies: {
          gs: "malformed-cookie",
        },
        session: {},
      };

      const res: any = {
        locals: { trace: "abc123" },
      };

      attachSessionIdsFromGsCookie(req, res);

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

      const res: any = {
        locals: { trace: "trace-xyz" },
      };

      attachSessionIdsFromGsCookie(req, res);

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
      const res: any = {
        locals: { trace: "trace-abc" },
      };

      attachSessionIdsFromGsCookie(req, res);

      expect(loggerInfo).toHaveBeenCalledOnce();
    });
  });
});
