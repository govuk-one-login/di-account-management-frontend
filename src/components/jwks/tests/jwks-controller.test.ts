import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";

describe("jwks-controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mockGetJWKS: any;

  beforeEach(() => {
    req = {};
    res = {
      json: vi.fn(),
      setHeader: vi.fn(),
    };
    next = vi.fn();
    mockGetJWKS = vi.fn();
  });

  describe("jwksGet", () => {
    it("should return JWKS as JSON", async () => {
      const mockJWKS = {
        keys: [
          {
            kty: "RSA",
            use: "sig",
            kid: "test-key-id",
            n: "test-modulus",
            e: "AQAB",
          },
        ],
      };

      vi.doMock("../jwks-service.js", () => ({
        getJWKS: mockGetJWKS.mockResolvedValue(mockJWKS),
      }));

      const { jwksGet } = await import("../jwks-controller.js");

      await jwksGet(req as Request, res as Response, next);

      expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "public, max-age=3600");
      expect(res.json).toHaveBeenCalledWith(mockJWKS);
    });
  });
});
