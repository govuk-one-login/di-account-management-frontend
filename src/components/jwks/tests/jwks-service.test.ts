import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import { GetPublicKeyCommandOutput } from "@aws-sdk/client-kms";

const rsaPublicKey = generateKeyPairSync("rsa", {
  modulusLength: 2048,
}).publicKey.export({ format: "der", type: "spki" });

describe("jwks-service", () => {
  let mockKmsService: any;
  const mockPublicKey: Partial<GetPublicKeyCommandOutput> = {
    KeyId:
      "arn:aws:kms:eu-west-2:123456789012:key/1234abcd-12ab-34cd-56ef-1234567890ab",
    PublicKey: rsaPublicKey,
  };

  beforeEach(() => {
    vi.resetModules();
    mockKmsService = {
      getPublicKey: vi.fn(),
    };
  });

  describe("getJWKS", () => {
    it("should build JWKS from KMS public key", async () => {
      mockKmsService.getPublicKey.mockResolvedValue(mockPublicKey);

      vi.doMock("../../../utils/kms.js", () => ({
        kmsService: mockKmsService,
      }));

      const { getJWKS } = await import("../jwks-service.js");
      const result = await getJWKS();

      expect(mockKmsService.getPublicKey).toHaveBeenCalled();
      expect(result.keys).toHaveLength(1);
      const key = result.keys[0];
      expect(key.kty).toBe("RSA");
      expect(key.use).toBe("sig");
      expect(key.kid).toBe("1234abcd-12ab-34cd-56ef-1234567890ab");
      expect(key.n).toEqual(expect.any(String));
      expect(key.e).toBe("AQAB");
    });

    it("should throw when PublicKey is missing", async () => {
      mockKmsService.getPublicKey.mockResolvedValue({
        KeyId:
          "arn:aws:kms:eu-west-2:123456789012:key/1234abcd-12ab-34cd-56ef-1234567890ab",
      });

      vi.doMock("../../../utils/kms.js", () => ({
        kmsService: mockKmsService,
      }));

      const { getJWKS } = await import("../jwks-service.js");

      await expect(getJWKS()).rejects.toThrow(
        "KMS did not return a public key"
      );
    });

    it("should memoize and not call KMS service twice", async () => {
      mockKmsService.getPublicKey.mockResolvedValue(mockPublicKey);

      vi.doMock("../../../utils/kms.js", () => ({
        kmsService: mockKmsService,
      }));

      const { getJWKS } = await import("../jwks-service.js");

      await getJWKS();
      await getJWKS();

      expect(mockKmsService.getPublicKey).toHaveBeenCalledTimes(1);
    });
  });
});
