import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { Client } from "openid-client";
import { authMiddleware } from "../../../src/middleware/auth-middleware.js";
import * as oidcUtils from "../../../src/utils/oidc.js";

describe("authMiddleware", () => {
  let middleware: ReturnType<typeof authMiddleware>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: ReturnType<typeof vi.fn>;
  let oidcClient: Client;
  beforeEach(() => {
    oidcClient = {} as Client;
    vi.spyOn(oidcUtils, "getOIDCClient").mockResolvedValue(oidcClient);
    req = {};
    res = {};
    next = vi.fn();
    middleware = authMiddleware({
      client_id: "test-client-id",
      callback_url: "http://localhost/callback",
      idp_url: "http://localhost/.well-known/openid-configuration",
      scopes: ["openid", "profile", "email"],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers the oidc client on the request object", async () => {
    await middleware(req as Request, res as Response, next);

    expect(req.oidc).toBe(oidcClient);
    expect(next).toHaveBeenCalledOnce();
  });

  it("does not mutate the response object", async () => {
    const snapshot = { ...res };

    await middleware(req as Request, res as Response, next);

    expect(res).toEqual(snapshot);
    expect(next).toHaveBeenCalledOnce();
  });

  it("thows an OIDC discovery unavailable error metric", async () => {
    const errorMessage = "OIDCDiscoveryUnavailable";
    vi.restoreAllMocks();
    vi.spyOn(oidcUtils, "getOIDCClient").mockRejectedValue(
      new Error(errorMessage)
    );
    req.metrics = {
      addMetric: vi.fn(),
    } as any;

    await middleware(req as Request, res as Response, next);

    expect(req.metrics.addMetric).toHaveBeenCalledWith(
      "OIDCDiscoveryUnavailable",
      expect.any(String),
      1
    );
  });
});
