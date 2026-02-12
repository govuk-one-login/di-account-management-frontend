import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { oidcAuthCallbackGet } from "../call-back-controller.js";
import { PATH_DATA, VECTORS_OF_TRUST } from "../../../app.constants";
import { ClientAssertionServiceInterface } from "../../../utils/types";
import { logger } from "../../../utils/logger.js";

describe("callback controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let loggerInfoSpy: ReturnType<typeof vi.fn>;
  let loggerErrorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    loggerInfoSpy = vi.spyOn(logger, "info");
    loggerErrorSpy = vi.spyOn(logger, "error");

    req = {
      body: {},
      query: {},
      session: {
        user: {},
        destroy: vi.fn(),
        state: vi.fn(),
        nonce: vi.fn(),
      } as any,
      t: vi.fn(),
      oidc: {
        callbackParams: vi.fn(),
        callback: vi.fn().mockReturnValue({
          accessToken: "accessToken",
          idToken: "idtoken",
          claims: () => {
            return { vot: VECTORS_OF_TRUST.MEDIUM };
          },
        }),
        userinfo: vi.fn().mockReturnValue({
          email: "ad@ad.com",
          phoneNumber: "12345678999",
        }),
        metadata: { client_id: "", redirect_uris: [] },
        issuer: {
          metadata: {},
        } as any,
      } as any,
      app: {
        locals: {
          sessionStore: {
            destroy: vi.fn(),
          },
        },
      } as any,
    };
    res = {
      render: vi.fn(),
      status: vi.fn(),
      redirect: vi.fn(() => {}),
      cookie: vi.fn(),
      locals: {
        trace: "fake_trace",
      },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("oidcAuthCallbackGet", () => {
    it("should redirect to /manage-your-account", async () => {
      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: vi.fn().mockResolvedValue("testassert"),
      };

      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);

      expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.YOUR_SERVICES.url);
    });

    it("should redirect to /manage-your-account and set cookie when consent query param present", async () => {
      req.query.cookie_consent = "accept";

      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: vi.fn().mockResolvedValue("testassert"),
      };

      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);

      expect(res.cookie).toHaveBeenCalledOnce();
      expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.YOUR_SERVICES.url);
    });

    it("should redirect to /manage-your-account and have _ga as query param when cookie consent accepted", async () => {
      req.query.cookie_consent = "accept";
      req.query._ga = "2.172053219.3232.1636392870-444224.1635165988";

      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: vi.fn().mockResolvedValue("testassert"),
      };

      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);

      expect(res.cookie).toHaveBeenCalledOnce();
      expect(res.redirect).toHaveBeenCalledWith(
        PATH_DATA.YOUR_SERVICES.url +
          "?_ga=2.172053219.3232.1636392870-444224.1635165988"
      );
    });

    it("should redirect to /start when not medium level auth", async () => {
      req.oidc.callback = vi.fn().mockResolvedValue({
        accessToken: "accessToken",
        idToken: "idtoken",
        claims: () => {
          return {
            vot: VECTORS_OF_TRUST.LOW,
            aud: "",
            exp: 123,
            iat: 456,
            iss: "iss",
            sub: "sub",
          };
        },
        expired: function (): boolean {
          throw new Error("Function not implemented.");
        },
      });
      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: vi.fn().mockResolvedValue("testassert"),
      };

      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);

      expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.START.url);
    });

    it("redirect to session expired when access denied error received", async () => {
      req.oidc.callbackParams = vi.fn().mockReturnValue({
        error: "access_denied",
        state: "m0H_2VvrhKR0qA",
      });
      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: vi.fn().mockResolvedValue("testassert"),
      };
      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);
      expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.SESSION_EXPIRED.url);
      expect(res.redirect).toHaveBeenCalledOnce();
    });

    it("redirect to session expired when any error occurs", async () => {
      req.oidc.callbackParams = vi.fn().mockReturnValue({
        error: "server_error",
        error_description: "Unexpected server error",
      });
      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: vi.fn().mockResolvedValue("testassert"),
      };
      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);
      expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.SESSION_EXPIRED.url);
    });

    it("should populate req.session.authSessionIds", async () => {
      req.cookies = {
        gs: "fake_session_id.fake_client_session_id",
      };

      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: vi.fn(),
      };

      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);

      expect(req.session.authSessionIds.sessionId).toBe("fake_session_id");
      expect(req.session.authSessionIds.clientSessionId).toBe(
        "fake_client_session_id"
      );
    });

    it("should not populate req.session.authSessionIds when gs cookie is malformed", async () => {
      req.cookies = {
        gs: "invalid_format",
      };

      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: vi.fn(),
      };

      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);

      expect(req.session.authSessionIds).toBe(undefined);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        { trace: "fake_trace" },
        "Malformed gs cookie contained: invalid_format"
      );
    });

    it("should not populate req.session.authSessionIds when gs cookie is not set", async () => {
      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: vi.fn(),
      };

      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);

      expect(req.session.authSessionIds).toBe(undefined);
      expect(loggerInfoSpy).toHaveBeenCalledWith(
        { trace: "fake_trace" },
        "gs cookie not in request."
      );
    });

    it("should redirect to session expired if session state is missing", async () => {
      req.session.state = undefined;

      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: vi.fn(),
      };

      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);

      expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.SESSION_EXPIRED.url);
    });

    it("should redirect to session expired if session nonce is missing", async () => {
      req.session.nonce = undefined;

      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: vi.fn(),
      };

      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);

      expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.SESSION_EXPIRED.url);
    });

    it("should redirect to session expired if session is missing", async () => {
      req.session = undefined;

      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: vi.fn(),
      };

      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);

      expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.SESSION_EXPIRED.url);
    });

    it("redirect to session expired when access denied error is thrown", async () => {
      req.oidc.callbackParams = vi.fn().mockImplementation(() => {
        throw new Error("access_denied");
      });
      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: vi.fn().mockResolvedValue("testassert"),
      };
      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);
      expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.SESSION_EXPIRED.url);
    });

    it("should throw an error if the userinfo call fails", async () => {
      req.oidc.userinfo = vi.fn().mockImplementation(() => {
        throw new Error("Some userinfo error");
      });

      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: vi.fn().mockResolvedValue("testassert"),
      };

      try {
        await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);
      } catch (error) {
        expect((error as Error).message).toBe("Failed to retrieve user info");
      }
    });
  });
});
