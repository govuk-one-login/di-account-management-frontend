import request from "supertest";
import { describe, beforeAll, afterAll, it, expect, vi } from "vitest";

describe("Integration:: JWKS endpoint", () => {
  let app: any;

  beforeAll(async () => {
    vi.resetModules();
    
    const oidc = await import("../../../utils/oidc.js");
    vi.spyOn(oidc, "getOIDCClient").mockImplementation(() => {
      return Promise.resolve({} as any);
    });

    vi.spyOn(oidc, "getCachedJWKS").mockImplementation(() => {
      return Promise.resolve({} as any);
    });

    app = await (await import("../../../app.js")).createApp();
  });

  afterAll(() => {
    vi.restoreAllMocks();
    app = undefined;
  });

  it("should return well-formed JWKS", async () => {
    const res = await request(app)
      .get("/.well-known/jwks.json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body).toBeDefined();
    expect(res.body).toHaveProperty("keys");
    expect(Array.isArray(res.body.keys)).toBe(true);
    expect(res.body.keys.length).toBeGreaterThan(0);
  });

  it("should have valid JWK structure per RFC 7517", async () => {
    const res = await request(app)
      .get("/.well-known/jwks.json")
      .expect(200);

    const jwk = res.body.keys[0];
    
    // Required fields per RFC 7517
    expect(jwk).toHaveProperty("kty");
    expect(jwk.kty).toBe("RSA");
    
    // RSA-specific fields per RFC 7518
    expect(jwk).toHaveProperty("n");
    expect(jwk).toHaveProperty("e");
    expect(typeof jwk.n).toBe("string");
    expect(typeof jwk.e).toBe("string");
    
    // Optional but recommended fields
    expect(jwk).toHaveProperty("use");
    expect(jwk.use).toBe("sig");
    expect(jwk).toHaveProperty("kid");
    expect(typeof jwk.kid).toBe("string");
  });

  it("should set cache control headers", async () => {
    const res = await request(app)
      .get("/.well-known/jwks.json")
      .expect(200);

    expect(res.headers["cache-control"]).toContain("public");
    expect(res.headers["cache-control"]).toContain("max-age=3600");
  });

  it("should not require authentication", async () => {
    const res = await request(app)
      .get("/.well-known/jwks.json")
      .expect(200);

    expect(res.statusCode).toBe(200);
  });
});
