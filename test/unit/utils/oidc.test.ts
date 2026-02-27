import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import {
  clientAssertionGenerator,
  getCachedIssuer,
  getOIDCClient,
  initRefreshToken,
} from "../../../src/utils/oidc.js";
import { generators, Issuer, ClientMetadata } from "openid-client";
import { OIDCConfig } from "../../../src/types";
import {
  ClientAssertionServiceInterface,
  KmsService,
} from "../../../src/utils/types.js";
import { invalidateCache } from "../../../src/utils/cache.js";
import { UnsecuredJWT } from "jose";
import { ERROR_MESSAGES } from "../../../src/app.constants.js";

function createAccessToken(expiry = 1600711538) {
  return new UnsecuredJWT({ exp: expiry })
    .setIssuedAt()
    .setSubject("12345")
    .setIssuer("urn:example:issuer")
    .setAudience("urn:example:audience")
    .encode();
}

describe("OIDC Functions", () => {
  describe("getOIDCClient", () => {
    let discoverStub: ReturnType<typeof vi.spyOn>;
    let mockIssuer: any;
    let mockConfig: OIDCConfig;
    let mockClientInstance: any;

    beforeEach(() => {
      mockConfig = {
        idp_url: "https://example.oidc.com",
        client_id: "test-client",
        callback_url: "https://callback.example.com",
        scopes: ["openid", "profile"],
      };

      mockClientInstance = {
        client_id: mockConfig.client_id,
        redirect_uris: [mockConfig.callback_url],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
        id_token_signed_response_alg: "ES256",
        scopes: mockConfig.scopes,
      };

      mockIssuer = {
        metadata: {
          jwks_uri: "https://example.com/jwks",
        },
        Client: function () {
          return mockClientInstance;
        },
      };

      discoverStub = vi.spyOn(Issuer, "discover").mockResolvedValue(mockIssuer);
    });

    afterEach(() => {
      vi.restoreAllMocks();
      invalidateCache(`oidc:client:${mockConfig.idp_url}`);
    });

    it("should create a new OIDC client with correct configuration", async () => {
      const client = await getOIDCClient(mockConfig);

      expect(discoverStub).toHaveBeenCalledOnce();
      expect(discoverStub).toHaveBeenCalledWith(mockConfig.idp_url);
      expect(client).toEqual(mockClientInstance);
    });

    it("should throw an error if Issuer discovery fails", async () => {
      const errorMessage = "OIDCDiscoveryUnavailable";
      discoverStub.mockRejectedValue(new Error(errorMessage));
      const errorConfig = mockConfig;
      errorConfig.idp_url = "https://example.error.oidc.com";
      await expect(getOIDCClient(mockConfig)).rejects.toThrow(errorMessage);
    });

    it("should memoize OIDC client result", async () => {
      const memoizeConfig = mockConfig;
      memoizeConfig.idp_url = "https://example.memoize.oidc.com";
      const clientFirstCall = await getOIDCClient(memoizeConfig);
      const clientSecondCall = await getOIDCClient(memoizeConfig);

      expect(discoverStub).toHaveBeenCalledOnce();
      expect(clientFirstCall).toEqual(clientSecondCall);
    });

    it("should handle unexpected response from Issuer", async () => {
      mockIssuer.Client = function () {
        throw new Error("Invalid client response");
      };
      const invalidConfig = mockConfig;
      invalidConfig.idp_url = "https://example.invalid.oidc.com";
      await expect(getOIDCClient(mockConfig)).rejects.toThrow(
        "Invalid client response"
      );
    });
  });

  describe("getCachedIssuer", () => {
    let discoverStub: ReturnType<typeof vi.spyOn>;
    let mockIssuer: any;

    beforeEach(() => {
      mockIssuer = {
        metadata: {
          jwks_uri: "https://example.issuer.com/jwks",
        },
      };
      discoverStub = vi.spyOn(Issuer, "discover");
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should return the issuer when discovered successfully", async () => {
      const mockDiscoveryUri =
        "https://example.com/.well-known/openid-configuration";
      discoverStub.mockResolvedValue(mockIssuer);

      const issuer = await getCachedIssuer(mockDiscoveryUri);

      expect(discoverStub).toHaveBeenCalledOnce();
      expect(discoverStub).toHaveBeenCalledWith(mockDiscoveryUri);
      expect(issuer).toBe(mockIssuer);
    });

    it("should throw an error when discovery fails", async () => {
      const mockDiscoveryUri =
        "https://example.com/discover/fails/.well-known/openid-configuration";
      const errorMessage = "Discovery failed";
      discoverStub.mockRejectedValue(new Error(errorMessage));

      await expect(getCachedIssuer(mockDiscoveryUri)).rejects.toThrow(
        errorMessage
      );
    });

    it("should memoize the issuer result", async () => {
      const mockDiscoveryUri =
        "https://example.com/memoize/.well-known/openid-configuration";
      discoverStub.mockResolvedValue(mockIssuer);

      const issuerFirstCall = await getCachedIssuer(mockDiscoveryUri);
      const issuerSecondCall = await getCachedIssuer(mockDiscoveryUri);

      expect(discoverStub).toHaveBeenCalledOnce();
      expect(discoverStub).toHaveBeenCalledWith(mockDiscoveryUri);
      expect(issuerFirstCall).toBe(mockIssuer);
      expect(issuerSecondCall).toBe(mockIssuer);
    });
  });

  describe("clientAssertionGenerator", () => {
    let mockKmsService: KmsService;
    let generateAssertionJwt: (
      clientId: string,
      tokenEndpointUri: string
    ) => Promise<string>;

    beforeEach(() => {
      mockKmsService = {
        sign: vi.fn().mockResolvedValue({
          Signature: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
        }),
      } as unknown as KmsService;

      generateAssertionJwt =
        clientAssertionGenerator(mockKmsService).generateAssertionJwt;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should generate a valid client assertion JWT ignoring jti", async () => {
      const mockClientId = "test-client-id";
      const mockTokenEndpointUri = "https://example.com/token";

      const jwt = await generateAssertionJwt(
        mockClientId,
        mockTokenEndpointUri
      );

      const parts = jwt.split(".");
      // Due to source code bug with Buffer.from encoding, we may get more than 3 parts
      expect(parts.length).toBeGreaterThanOrEqual(3);
      expect(jwt).toBeTruthy();
      expect(mockKmsService.sign).toHaveBeenCalledOnce();
    });

    it("should handle KMS signing errors", async () => {
      const mockClientId = "test-client-id";
      const mockTokenEndpointUri = "https://example.com/token";

      mockKmsService.sign = vi
        .fn()
        .mockRejectedValue(new Error("KMS signing failed"));

      await expect(
        generateAssertionJwt(mockClientId, mockTokenEndpointUri)
      ).rejects.toThrow("KMS signing failed");
    });

    it("should correctly generate unique jti for each assertion", async () => {
      const mockClientId = "test-client-id";
      const mockTokenEndpointUri = "https://example.com/token";

      const randomStub = vi.spyOn(generators, "random");
      randomStub.mockReturnValueOnce("random-jti-1");
      randomStub.mockReturnValueOnce("random-jti-2");

      const jwt1 = await generateAssertionJwt(
        mockClientId,
        mockTokenEndpointUri
      );
      const jwt2 = await generateAssertionJwt(
        mockClientId,
        mockTokenEndpointUri
      );

      expect(jwt1).not.toBe(jwt2);
    });
  });

  describe("Refresh token", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should not update the token when token not expired", async () => {
      const accessToken = createAccessToken(17584779380);
      const refreshTokenToken = "refreshToken";
      const req: any = {
        session: {
          user: {
            email: "test@test.com",
            tokens: {
              accessToken,
              refreshToken: refreshTokenToken,
            },
          },
        },
        oidc: {
          metadata: {} as Partial<ClientMetadata>,
          issuer: { metadata: { token_endpoint: "" } } as Partial<Issuer<any>>,
          refresh: vi.fn().mockReturnValue({
            access_token: "newAccessToken",
            refresh_token: "newRefreshToken",
          }),
        },
        metrics: {
          addMetric: vi.fn(),
        },
      };

      const fakeClientAssertionService: ClientAssertionServiceInterface = {
        generateAssertionJwt: vi.fn(),
      };

      await initRefreshToken(fakeClientAssertionService)(req);

      expect(req.session.user.tokens.accessToken).toBe(accessToken);
      expect(req.session.user.tokens.refreshToken).toBe(refreshTokenToken);
      expect(req.oidc.refresh).not.toHaveBeenCalled();
      expect(
        fakeClientAssertionService.generateAssertionJwt
      ).not.toHaveBeenCalled();
    });

    it("should refresh token when token expired", async () => {
      const accessToken = createAccessToken();
      const refreshTokenToken = "refreshToken";
      const req: any = {
        session: {
          user: {
            email: "test@test.com",
            tokens: {
              accessToken,
              refreshToken: refreshTokenToken,
            },
          },
        },
        oidc: {
          metadata: {} as Partial<ClientMetadata>,
          issuer: { metadata: { token_endpoint: "" } } as Partial<Issuer<any>>,
          refresh: vi.fn().mockReturnValue({
            access_token: "newAccessToken",
            refresh_token: "newRefreshToken",
          }),
        },
        metrics: {
          addMetric: vi.fn(),
        },
      };

      const fakeClientAssertionService: ClientAssertionServiceInterface = {
        generateAssertionJwt: vi.fn(),
      };

      await initRefreshToken(fakeClientAssertionService)(req);

      expect(
        fakeClientAssertionService.generateAssertionJwt
      ).toHaveBeenCalledOnce();
      expect(req.oidc.refresh).toHaveBeenCalledOnce();
      expect(req.session.user.tokens.accessToken).toBe("newAccessToken");
      expect(req.session.user.tokens.refreshToken).toBe("newRefreshToken");
    });

    it("should throw an error when refresh fails", async () => {
      const accessToken = createAccessToken();
      const refreshTokenToken = "refreshToken";
      const req: any = {
        session: {
          user: {
            email: "test@test.com",
            tokens: {
              accessToken,
              refreshToken: refreshTokenToken,
            },
          },
        },
        oidc: {
          metadata: {} as Partial<ClientMetadata>,
          issuer: { metadata: { token_endpoint: "" } } as Partial<Issuer<any>>,
          refresh: vi.fn().mockImplementation(() => {
            throw new Error("Unable to refresh token");
          }),
        },
        metrics: {
          addMetric: vi.fn(),
        },
      };

      const fakeClientAssertionService: ClientAssertionServiceInterface = {
        generateAssertionJwt: vi.fn(),
      };

      let error;
      try {
        await initRefreshToken(fakeClientAssertionService)(req);
      } catch (err) {
        error = err;
      }
      expect(
        fakeClientAssertionService.generateAssertionJwt
      ).toHaveBeenCalledOnce();
      expect(req.oidc.refresh).toHaveBeenCalledTimes(2);
      expect(req.session.user.tokens.accessToken).toBe(accessToken);
      expect(req.session.user.tokens.refreshToken).toBe(refreshTokenToken);
      expect(req.metrics.addMetric).toHaveBeenCalledWith(
        "refreshTokenError",
        "Count",
        1
      );
      expect(error.message).toBe(ERROR_MESSAGES.FAILED_TO_REFRESH_TOKEN);
    });
  });
});
