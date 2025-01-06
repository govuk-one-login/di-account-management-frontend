import { describe, it, beforeEach, afterEach } from "mocha";
import {
  clientAssertionGenerator,
  getCachedIssuer,
  getCachedJWKS,
  getOIDCClient,
} from "../../../src/utils/oidc";
import { sinon, expect } from "../../utils/test-utils";
import { generators, Issuer } from "openid-client";
import { OIDCConfig } from "../../../src/types";
import * as jose from "jose";
import {
  ClientAssertionServiceInterface,
  KmsService,
} from "../../../src/utils/types";
import base64url from "base64url";

describe("OIDC Functions", () => {
  describe("getOIDCClient", () => {
    let sandbox: sinon.SinonSandbox;
    let discoverStub: sinon.SinonStub;
    let mockIssuer: any;
    let mockConfig: OIDCConfig;
    let mockClientInstance: any;

    beforeEach(() => {
      sandbox = sinon.createSandbox();

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
        Client: sandbox.stub().returns(mockClientInstance),
      };

      discoverStub = sandbox.stub(Issuer, "discover").resolves(mockIssuer);
    });

    afterEach(() => {
      sandbox.restore();
    });

    it("should create a new OIDC client with correct configuration", async () => {
      const client = await getOIDCClient(mockConfig);

      // Assert that discover was called correctly
      expect(discoverStub.calledOnce).to.be.true;
      expect(discoverStub.calledWith(mockConfig.idp_url)).to.be.true;

      // Assert client properties
      expect(client).to.deep.equal(mockClientInstance); // Ensure the client matches the expected properties

      // Verify that the Client constructor was called with the correct parameters
      expect(mockIssuer.Client).to.have.been.calledOnceWith({
        client_id: mockConfig.client_id,
        redirect_uris: [mockConfig.callback_url],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
        id_token_signed_response_alg: "ES256",
        scopes: mockConfig.scopes,
      });
    });

    it("should throw an error if Issuer discovery fails", async () => {
      const errorMessage = "Issuer discovery failed";
      discoverStub.rejects(new Error(errorMessage));
      const errorConfig = mockConfig;
      errorConfig.idp_url = "https://example.error.oidc.com";
      await expect(getOIDCClient(mockConfig)).to.be.rejectedWith(errorMessage);
    });

    it("should cache OIDC client result", async () => {
      const memoizeConfig = mockConfig;
      memoizeConfig.idp_url = "https://example.memoize.oidc.com";
      const clientFirstCall = await getOIDCClient(memoizeConfig);
      const clientSecondCall = await getOIDCClient(memoizeConfig);

      expect(discoverStub).to.have.been.calledOnce;
      expect(clientFirstCall).to.deep.equal(clientSecondCall);
    });

    it("should handle unexpected response from Issuer", async () => {
      mockIssuer.Client.throws(new Error("Invalid client response"));
      const invalidConfig = mockConfig;
      invalidConfig.idp_url = "https://example.invalid.oidc.com";
      await expect(getOIDCClient(mockConfig)).to.be.rejectedWith(
        "Invalid client response"
      );
    });
  });

  describe("getCachedJWKS", () => {
    let sandbox: sinon.SinonSandbox;
    let mockIssuer: any;
    let mockCreateRemoteJWKSet: sinon.SinonStub;
    let config: OIDCConfig;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      mockIssuer = {
        metadata: {
          jwks_uri: "https://example.com/.well-known/jwks.json",
        },
      };
      config = {
        idp_url: "https://example.jwk.com",
        client_id: "test-client",
        callback_url: "https://callback.example.com",
        scopes: ["openid", "profile"],
      };
      sandbox.stub(Issuer, "discover").resolves(mockIssuer);

      mockCreateRemoteJWKSet = sandbox.stub();
      sandbox.replaceGetter(
        jose,
        "createRemoteJWKSet",
        () => mockCreateRemoteJWKSet
      );
    });

    afterEach(() => {
      sandbox.restore();
    });

    it("should cache JWKS for valid config", async () => {
      const mockJWKS = {
        keys: [{ kid: "test-kid" }],
      };
      mockCreateRemoteJWKSet.returns({ jwks: async () => mockJWKS });

      // First call to getCachedJWKS
      const result1 = await getCachedJWKS(config);
      expect(result1).to.deep.equal(mockJWKS);
      expect(Issuer.discover).to.have.been.calledOnceWith(config.idp_url);
      expect(mockCreateRemoteJWKSet).to.have.been.calledOnceWith(
        new URL(mockIssuer.metadata.jwks_uri),
        {
          headers: { "User-Agent": "AccountManagement/1.0.0" },
        }
      );

      const result2 = await getCachedJWKS(config);
      expect(result2).to.deep.equal(mockJWKS);

      expect(Issuer.discover).to.have.been.calledOnce;
      expect(mockCreateRemoteJWKSet).to.have.been.calledOnce;
    });

    it("should throw an error if JWKS creation fails", async () => {
      const errorMessage = "Failed to create JWKS";
      mockCreateRemoteJWKSet.returns({
        jwks: async () => {
          throw new Error(errorMessage);
        },
      });

      const configError = {
        ...config,
        idp_url: "https://example.jwk.error.com",
      };

      try {
        await getCachedJWKS(configError);
        expect.fail("Failed to create JWKS");
      } catch (error) {
        expect(error.message).to.equal(errorMessage);
      }
    });
  });

  describe("getCachedIssuer", () => {
    let sandbox: sinon.SinonSandbox;
    let discoverStub: sinon.SinonStub;
    let mockIssuer: any;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      mockIssuer = {
        metadata: {
          jwks_uri: "https://example.issuer.com/jwks",
        },
      };
      discoverStub = sandbox.stub(Issuer, "discover");
    });

    afterEach(() => {
      sandbox.restore();
    });

    it("should return the issuer when discovered successfully", async () => {
      const mockDiscoveryUri =
        "https://example.com/.well-known/openid-configuration";
      discoverStub.resolves(mockIssuer);

      const issuer = await getCachedIssuer(mockDiscoveryUri);

      expect(discoverStub).to.have.been.calledOnceWith(mockDiscoveryUri);
      expect(issuer).to.equal(mockIssuer);
    });

    it("should throw an error when discovery fails", async () => {
      const mockDiscoveryUri =
        "https://example.com/discover/fails/.well-known/openid-configuration";
      const errorMessage = "Discovery failed";
      discoverStub.rejects(new Error(errorMessage));

      await expect(getCachedIssuer(mockDiscoveryUri)).to.be.rejectedWith(
        errorMessage
      );
    });

    it("should memoize the issuer result", async () => {
      const mockDiscoveryUri =
        "https://example.com/memoize/.well-known/openid-configuration";
      discoverStub.resolves(mockIssuer);

      const issuerFirstCall = await getCachedIssuer(mockDiscoveryUri);
      const issuerSecondCall = await getCachedIssuer(mockDiscoveryUri);

      expect(discoverStub).to.have.been.calledOnceWith(mockDiscoveryUri);
      expect(issuerFirstCall).to.equal(mockIssuer);
      expect(issuerSecondCall).to.equal(mockIssuer);
    });
  });

  describe("clientAssertionGenerator", () => {
    let sandbox: sinon.SinonSandbox;
    let mockKmsService: sinon.SinonStubbedInstance<KmsService>;
    let generateAssertionJwt: ClientAssertionServiceInterface["generateAssertionJwt"];

    beforeEach(() => {
      sandbox = sinon.createSandbox();

      mockKmsService = {
        sign: sandbox.stub().resolves({
          Signature: Buffer.from("test-signature"),
        }),
      } as unknown as sinon.SinonStubbedInstance<KmsService>;

      generateAssertionJwt =
        clientAssertionGenerator(mockKmsService).generateAssertionJwt;
    });

    afterEach(() => {
      sandbox.restore();
    });

    it("should generate a valid client assertion JWT ignoring jti", async () => {
      const mockClientId = "test-client-id";
      const mockTokenEndpointUri = "https://example.com/token";

      const jwt = await generateAssertionJwt(
        mockClientId,
        mockTokenEndpointUri
      );

      const [encodedHeader, encodedPayload] = jwt.split(".");

      const decodedHeader = JSON.parse(base64url.decode(encodedHeader));
      const decodedPayload = JSON.parse(base64url.decode(encodedPayload));

      expect(decodedHeader).to.deep.equal({
        alg: "RS512",
        typ: "JWT",
      });

      expect(decodedPayload.iss).to.equal(mockClientId);
      expect(decodedPayload.sub).to.equal(mockClientId);
      expect(decodedPayload.aud).to.equal(mockTokenEndpointUri);
      expect(decodedPayload.exp).to.be.a("number");
      expect(decodedPayload.iat).to.be.a("number");

      expect(decodedPayload).to.have.property("jti");
    });

    it("should handle KMS signing errors", async () => {
      const mockClientId = "test-client-id";
      const mockTokenEndpointUri = "https://example.com/token";

      mockKmsService.sign.rejects(new Error("KMS signing failed"));

      await expect(
        generateAssertionJwt(mockClientId, mockTokenEndpointUri)
      ).to.be.rejectedWith("KMS signing failed");
    });

    it("should correctly generate unique jti for each assertion", async () => {
      const mockClientId = "test-client-id";
      const mockTokenEndpointUri = "https://example.com/token";

      const randomStub = sandbox.stub(generators, "random");
      randomStub.onFirstCall().returns("random-jti-1");
      randomStub.onSecondCall().returns("random-jti-2");

      const jwt1 = await generateAssertionJwt(
        mockClientId,
        mockTokenEndpointUri
      );
      const jwt2 = await generateAssertionJwt(
        mockClientId,
        mockTokenEndpointUri
      );

      expect(jwt1).to.not.equal(jwt2);
    });
  });
});
