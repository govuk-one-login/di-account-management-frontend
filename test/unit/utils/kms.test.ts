import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("kmsService", () => {
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockSend = vi.fn();

    vi.doMock("@aws-sdk/client-kms", () => ({
      KMSClient: class {
        send = mockSend;
      },
      SignCommand: vi.fn(),
      GetPublicKeyCommand: vi.fn(),
      MessageType: { RAW: "RAW" },
      SigningAlgorithmSpec: { RSASSA_PKCS1_V1_5_SHA_512: "RSASSA_PKCS1_V1_5_SHA_512" },
    }));
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("should call sign with correct parameters", async () => {
    const mockSignature = new Uint8Array([1, 2, 3]);
    mockSend.mockResolvedValue({
      Signature: mockSignature,
      KeyId: "test-key-id",
      SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_512",
    });

    const { kmsService } = await import("../../../src/utils/kms.js");
    const result = await kmsService.sign("test-payload");

    expect(mockSend).toHaveBeenCalledOnce();
    expect(result.Signature).toEqual(mockSignature);
  });

  it("should call getPublicKey with correct parameters", async () => {
    const mockPublicKey = Buffer.from("mock-public-key");
    mockSend.mockResolvedValue({
      KeyId: "test-key-id",
      PublicKey: mockPublicKey,
    });

    const { kmsService } = await import("../../../src/utils/kms.js");
    const result = await kmsService.getPublicKey();

    expect(mockSend).toHaveBeenCalledOnce();
    expect(result.PublicKey).toEqual(mockPublicKey);
  });
});
