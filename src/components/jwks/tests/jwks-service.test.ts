import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetPublicKeyCommandOutput } from "@aws-sdk/client-kms";

describe("jwks-service", () => {
  let mockKmsService: any;
  let mockGetKmsKeyId: any;
  const mockPublicKey: Partial<GetPublicKeyCommandOutput> = {
    KeyId: "arn:aws:kms:eu-west-2:123456789012:key/1234abcd-12ab-34cd-56ef-1234567890ab",
    PublicKey: Buffer.from("test-public-key"),
  };

  beforeEach(() => {
    vi.resetModules();
    mockKmsService = {
      getPublicKey: vi.fn(),
    };
    mockGetKmsKeyId = vi.fn().mockReturnValue("arn:aws:kms:eu-west-2:123456789012:key/1234abcd-12ab-34cd-56ef-1234567890ab");
  });

  describe("getJWKS", () => {
    it("should build JWKS from KMS public key", async () => {

      mockKmsService.getPublicKey.mockResolvedValue(mockPublicKey);

      vi.doMock("../../../utils/kms.js", () => ({
        kmsService: mockKmsService,
      }));
      
      vi.doMock("../../../config.js", () => ({
        getKmsKeyId: mockGetKmsKeyId,
      }));

      const { getJWKS } = await import("../jwks-service.js");
      const result = await getJWKS();

      expect(mockKmsService.getPublicKey).toHaveBeenCalled();
      expect(result).toEqual({
        keys: [
          {
            kty: "RSA",
            use: "sig",
            kid: "1234abcd-12ab-34cd-56ef-1234567890ab",
            n: Buffer.from("test-public-key").toString("base64url"),
            e: "AQAB",
          },
        ],
      });
    });

    it("should memoize and not call KMS service twice", async () => {
      mockKmsService.getPublicKey.mockResolvedValue(mockPublicKey);

      vi.doMock("../../../utils/kms.js", () => ({
        kmsService: mockKmsService,
      }));
      
      vi.doMock("../../../config.js", () => ({
        getKmsKeyId: mockGetKmsKeyId,
      }));

      const { getJWKS } = await import("../jwks-service.js");
      
      await getJWKS();
      await getJWKS();

      expect(mockKmsService.getPublicKey).toHaveBeenCalledTimes(1);
    });
  });
});
