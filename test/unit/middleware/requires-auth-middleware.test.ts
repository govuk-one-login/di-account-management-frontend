import { describe, it, expect, vi } from "vitest";
import { requiresAuthMiddleware } from "../../../src/middleware/requires-auth-middleware.js";
import { PATH_DATA } from "../../../src/app.constants.js";
import { Request, Response, NextFunction } from "express";
import { generators } from "openid-client";
import { kmsService } from "../../../src/utils/kms.js";
import type { SignCommandOutput } from "@aws-sdk/client-kms";

describe("Requires auth middleware", () => {
  it("should redirect to signed out page if user logged out", async () => {
    const req: any = {
      session: {
        user: {
          isAuthenticated: false,
        } as any,
      },
      cookies: {
        lo: "true",
      },
    };

    const res: any = { locals: {}, redirect: vi.fn() };
    const nextFunction: NextFunction = vi.fn(() => {});

    await requiresAuthMiddleware(req, res, nextFunction);

    expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.USER_SIGNED_OUT.url);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it("should redirect to session expired page if user not authenticated", async () => {
    const req: any = {
      session: {
        user: {
          email: "test@test.com",
          isAuthenticated: false,
        },
      },
    };

    const res: any = { locals: {}, redirect: vi.fn() };
    const nextFunction: NextFunction = vi.fn(() => {});

    await requiresAuthMiddleware(req, res, nextFunction);

    expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.SESSION_EXPIRED.url);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it("should redirect to session expired page if no user session", async () => {
    const req: any = {
      session: {
        user: {
          isAuthenticated: false,
        },
      },
    };
    const res: any = { locals: {}, redirect: vi.fn() };
    const nextFunction: NextFunction = vi.fn(() => {});

    await requiresAuthMiddleware(req, res, nextFunction);

    expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.SESSION_EXPIRED.url);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it("should call next user session is valid", async () => {
    const req: any = {
      session: {
        user: {
          email: "test@test.com",
          isAuthenticated: true,
        },
      },
    };
    const res: any = {
      locals: {},
      redirect: vi.fn(),
      cookie: vi.fn(),
    };
    const nextFunction: NextFunction = vi.fn(() => {});

    await requiresAuthMiddleware(req, res, nextFunction);

    expect(nextFunction).toHaveBeenCalledOnce();
  });

  it("should call next and reset lo cookie to false if user is authenticated", async () => {
    const req: any = {
      session: {
        user: {
          email: "test@test.com",
          isAuthenticated: true,
        },
        cookies: {
          lo: "true",
        },
      },
    };

    const res: any = {
      locals: {},
      redirect: vi.fn(),
      mockCookies: {},
      cookie: function (name: string, value: string) {
        this.mockCookies[name] = value;
      },
    };
    const nextFunction: NextFunction = vi.fn(() => {});

    await requiresAuthMiddleware(req, res, nextFunction);

    expect(nextFunction).toHaveBeenCalledOnce();
    expect(res.mockCookies.lo).toBe("false");
  });

  it("should redirect to Log in page", async () => {
    vi.spyOn(generators, "nonce").mockReturnValue("generated");
    vi.spyOn(kmsService, "sign").mockResolvedValue({
      Signature: new Uint8Array([1, 2, 3]),
      KeyId: "",
      SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_512",
      $metadata: {},
    }) as unknown as SignCommandOutput;
    const req: Partial<Request> = {
      body: {},
      session: {
        user: { isAuthenticated: undefined } as any,
      } as any,
      url: "/test_url",
      query: { cookie_consent: "test" },
      oidc: {
        authorizationUrl: vi.fn(),
        metadata: {
          scopes: "openid",
          redirect_uris: ["url"],
          client_id: "test-client",
        },
      } as any,
    };

    const res: Partial<Response> = {
      render: vi.fn(),
      redirect: vi.fn(() => {}),
      locals: {},
    };

    const nextFunction: NextFunction = vi.fn(() => {});
    await requiresAuthMiddleware(req as Request, res as Response, nextFunction);

    expect(res.redirect).toHaveBeenCalled();
    expect(kmsService.sign).toHaveBeenCalled();
    expect(req.oidc.authorizationUrl).toHaveBeenCalledOnce();
    const callArgs = (req.oidc.authorizationUrl as any).mock.calls[0][0];
    expect(callArgs).toMatchObject({
      client_id: "test-client",
      response_type: "code",
      scope: "openid",
    });
    expect(callArgs.request).toBeDefined();
    expect(typeof callArgs.request).toBe("string");
    vi.restoreAllMocks();
  });
});
