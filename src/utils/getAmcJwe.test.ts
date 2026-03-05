import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAmcJwe } from "./getAmcJwe.js";
import * as awsConfig from "../config/aws.js";
import * as config from "../config.js";
import * as kmsModule from "./kms.js";

vi.mock("../config/aws.js", () => ({
  getKMSConfig: vi.fn(() => ({
    kmsKeyId: "arn:aws:kms:region:account:key/test-key-id",
    awsConfig: { region: "us-east-1" },
  })),
}));
vi.mock("../config.js", () => ({
  getHomeBaseUrl: vi.fn(),
  getAmcAuthorizeUrl: vi.fn(),
  getAmcClientId: vi.fn(),
  getAmcJwksUrl: vi.fn(),
  getLogLevel: vi.fn(() => "info"),
}));
vi.mock("./kms.js");
vi.mock("../app.constants.js", () => ({
  PATH_DATA: {
    AMC_CALLBACK: { url: "/amc-callback" },
  },
}));
vi.mock("node:crypto", () => ({
  randomUUID: vi.fn(() => "test-uuid-1234"),
}));

global.fetch = vi.fn();

describe("getAmcJwe", () => {
  const mockUser = {
    internalPairwiseId: "internal-id-123",
    publicSubjectId: "public-id-456",
    email: "test@example.com",
  };

  const mockSignature = new Uint8Array([1, 2, 3, 4, 5]);
  const mockEncryptionJWK = {
    kty: "RSA",
    n: "1-CJy8eqOX9r0NLsQqIeknEmOjfSlCX5oU7yWMWRqoorDit-7GvZS6J0I0zlKUjMfAQCFeTz9I4-7yA1eZCczqqpxWuHugr_KLfz7EaSwCFl9vVhHwiGcvf5_On6afxplFFzWDOtT4xpE1jUkvKHligFADwF3cnTbap4a0rqzwVpww2_jcyJk5Ki0AYxljKo-zpKQf6hhpK_KW_H_DYhOO1ezxjxOscWZbknI6AWU_59NSaSlMsZ0A5ssikDxhEZvldditeDbrWpFCyA3O6Z9_ZPVii7V5FDjxOHaDKNbMm8fYiN3wrwCJoOIHsCSpDvDYas4CIS7_BCu_6oTjXpcw",
    e: "AQAB",
    use: "enc",
    alg: "RSA-OAEP-256",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

    vi.spyOn(config, "getHomeBaseUrl").mockReturnValue(
      "https://home.example.com"
    );
    vi.spyOn(config, "getAmcAuthorizeUrl").mockReturnValue(
      "https://amc.example.com/authorize"
    );
    vi.spyOn(config, "getAmcClientId").mockReturnValue("test-client-id");
    vi.spyOn(config, "getAmcJwksUrl").mockReturnValue(
      "https://amc.example.com/.well-known/jwks.json"
    );

    vi.mocked(kmsModule.kmsService.sign).mockResolvedValue({
      Signature: mockSignature,
    } as any);

    vi.mocked(fetch).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ keys: [mockEncryptionJWK] }),
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should generate JWS and JWE with correct structure", async () => {
    const result = await getAmcJwe("openid email", "state-123", mockUser);

    expect(result).toHaveProperty("jws");
    expect(result).toHaveProperty("jwe");
    expect(typeof result.jws).toBe("string");
    expect(typeof result.jwe).toBe("string");
  });

  it("should extract kid from kmsKeyId with slashes", async () => {
    await getAmcJwe("openid", "state-123", mockUser);

    const signCall = vi.mocked(kmsModule.kmsService.sign).mock.calls[0][0];
    const [headerPart] = signCall.split(".");
    const decodedHeader = JSON.parse(
      Buffer.from(headerPart, "base64url").toString()
    );

    expect(decodedHeader.kid).toBe("test-key-id");
  });

  it("should use kmsKeyId as kid when no slashes present", async () => {
    vi.spyOn(awsConfig, "getKMSConfig").mockReturnValueOnce({
      kmsKeyId: "simple-key-id",
      awsConfig: { region: "us-east-1" },
    } as any);

    await getAmcJwe("openid", "state-123", mockUser);

    const signCall = vi.mocked(kmsModule.kmsService.sign).mock.calls[0][0];
    const [headerPart] = signCall.split(".");
    const decodedHeader = JSON.parse(
      Buffer.from(headerPart, "base64url").toString()
    );

    expect(decodedHeader.kid).toBe("simple-key-id");
  });

  it("should create JWT header with correct algorithm and type", async () => {
    await getAmcJwe("openid", "state-123", mockUser);

    const signCall = vi.mocked(kmsModule.kmsService.sign).mock.calls[0][0];
    const [headerPart] = signCall.split(".");
    const decodedHeader = JSON.parse(
      Buffer.from(headerPart, "base64url").toString()
    );

    expect(decodedHeader.alg).toBe("RS512");
    expect(decodedHeader.typ).toBe("JWT");
  });

  it("should create payload with all required fields", async () => {
    const scope = "openid email profile";
    const state = "state-xyz";

    await getAmcJwe(scope, state, mockUser);

    const signCall = vi.mocked(kmsModule.kmsService.sign).mock.calls[0][0];
    const [, payloadPart] = signCall.split(".");
    const decodedPayload = JSON.parse(
      Buffer.from(payloadPart, "base64url").toString()
    );

    expect(decodedPayload.client_id).toBe("test-client-id");
    expect(decodedPayload.iss).toBe("test-client-id");
    expect(decodedPayload.aud).toBe("https://amc.example.com/authorize");
    expect(decodedPayload.scope).toBe(scope);
    expect(decodedPayload.state).toBe(state);
    expect(decodedPayload.email).toBe(mockUser.email);
    expect(decodedPayload.public_sub).toBe(mockUser.publicSubjectId);
    expect(decodedPayload.sub).toBe(mockUser.internalPairwiseId);
    expect(decodedPayload.response_type).toBe("code");
    expect(decodedPayload.jti).toBe("test-uuid-1234");
  });

  it("should include access tokens when provided", async () => {
    const amcToken = "amc-token-123";
    const adaToken = "ada-token-456";

    await getAmcJwe("openid", "state-123", mockUser, amcToken, adaToken);

    const signCall = vi.mocked(kmsModule.kmsService.sign).mock.calls[0][0];
    const [, payloadPart] = signCall.split(".");
    const decodedPayload = JSON.parse(
      Buffer.from(payloadPart, "base64url").toString()
    );

    expect(decodedPayload.account_management_api_access_token).toBe(amcToken);
    expect(decodedPayload.account_data_api_access_token).toBe(adaToken);
  });

  it("should not include access tokens when not provided", async () => {
    await getAmcJwe("openid", "state-123", mockUser);

    const signCall = vi.mocked(kmsModule.kmsService.sign).mock.calls[0][0];
    const [, payloadPart] = signCall.split(".");
    const decodedPayload = JSON.parse(
      Buffer.from(payloadPart, "base64url").toString()
    );

    expect(decodedPayload.account_management_api_access_token).toBeUndefined();
    expect(decodedPayload.account_data_api_access_token).toBeUndefined();
  });

  it("should set expiration to 2 minutes from now", async () => {
    await getAmcJwe("openid", "state-123", mockUser);

    const signCall = vi.mocked(kmsModule.kmsService.sign).mock.calls[0][0];
    const [, payloadPart] = signCall.split(".");
    const decodedPayload = JSON.parse(
      Buffer.from(payloadPart, "base64url").toString()
    );

    expect(decodedPayload.iat).toBe(1704067200);
    expect(decodedPayload.exp).toBe(1704067320);
  });

  it("should construct redirect_uri from base URL and callback path", async () => {
    vi.spyOn(config, "getHomeBaseUrl").mockReturnValue("https://test.gov.uk");

    await getAmcJwe("openid", "state-123", mockUser);

    const signCall = vi.mocked(kmsModule.kmsService.sign).mock.calls[0][0];
    const [, payloadPart] = signCall.split(".");
    const decodedPayload = JSON.parse(
      Buffer.from(payloadPart, "base64url").toString()
    );

    expect(decodedPayload.redirect_uri).toBe(
      "https://test.gov.uk/amc-callback"
    );
  });

  it("should call kmsService.sign with correct signing input", async () => {
    await getAmcJwe("openid", "state-123", mockUser);

    expect(kmsModule.kmsService.sign).toHaveBeenCalledTimes(1);
    const signInput = vi.mocked(kmsModule.kmsService.sign).mock.calls[0][0];
    expect(signInput).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });

  it("should create JWS with three parts separated by dots", async () => {
    const result = await getAmcJwe("openid", "state-123", mockUser);

    const parts = result.jws.split(".");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBeTruthy();
    expect(parts[1]).toBeTruthy();
    expect(parts[2]).toBeTruthy();
  });

  it("should fetch JWKS from correct URL", async () => {
    await getAmcJwe("openid", "state-123", mockUser);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      new URL("https://amc.example.com/.well-known/jwks.json")
    );
  });

  it("should find encryption key with use=enc from JWKS", async () => {
    const mockJwks = {
      keys: [
        { kty: "RSA", use: "sig", alg: "RS256" },
        mockEncryptionJWK,
        { kty: "RSA", use: "sig", alg: "RS512" },
      ],
    };

    vi.mocked(fetch).mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockJwks),
    } as any);

    const result = await getAmcJwe("openid", "state-123", mockUser);

    expect(result.jwe).toBeTruthy();
  });

  it("should encrypt JWS with RSA-OAEP-256 and A256GCM", async () => {
    const result = await getAmcJwe("openid", "state-123", mockUser);

    expect(result.jwe).toBeTruthy();
    const parts = result.jwe.split(".");
    expect(parts.length).toBeGreaterThanOrEqual(5);
  });

  it("should handle different user data", async () => {
    const differentUser = {
      internalPairwiseId: "different-internal",
      publicSubjectId: "different-public",
      email: "different@test.com",
    };

    await getAmcJwe("openid", "state-456", differentUser);

    const signCall = vi.mocked(kmsModule.kmsService.sign).mock.calls[0][0];
    const [, payloadPart] = signCall.split(".");
    const decodedPayload = JSON.parse(
      Buffer.from(payloadPart, "base64url").toString()
    );

    expect(decodedPayload.email).toBe(differentUser.email);
    expect(decodedPayload.public_sub).toBe(differentUser.publicSubjectId);
    expect(decodedPayload.sub).toBe(differentUser.internalPairwiseId);
  });

  it("should handle KMS signing errors", async () => {
    vi.mocked(kmsModule.kmsService.sign).mockRejectedValue(
      new Error("KMS signing failed")
    );

    await expect(getAmcJwe("openid", "state-123", mockUser)).rejects.toThrow(
      "KMS signing failed"
    );
  });

  it("should handle JWKS fetch errors", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    await expect(getAmcJwe("openid", "state-123", mockUser)).rejects.toThrow(
      "Network error"
    );
  });

  it("should handle JWKS JSON parsing errors", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Invalid JSON"));

    await expect(getAmcJwe("openid", "state-123", mockUser)).rejects.toThrow(
      "Invalid JSON"
    );
  });
});
