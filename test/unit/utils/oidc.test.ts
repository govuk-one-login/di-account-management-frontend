import { expect } from "chai";
import { describe, it, beforeEach, afterEach } from "mocha";
import { getIssuer, getJWKS, getOIDCClient } from "../../../src/utils/oidc";
import sinon from "sinon";
import { Issuer } from "openid-client";
import { OIDCConfig } from "../../../src/types";
import * as jose from "jose";

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

      // Stub Issuer.discover to resolve the mockIssuer
      discoverStub = sandbox.stub(Issuer, "discover").resolves(mockIssuer);
    });

    afterEach(() => {
      sandbox.restore(); // Ensure that the sandbox is properly restored after each test
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

    it("should memoize OIDC client result", async () => {
      const memoizeConfig = mockConfig;
      memoizeConfig.idp_url = "https://example.memoize.oidc.com";
      const clientFirstCall = await getOIDCClient(memoizeConfig);
      const clientSecondCall = await getOIDCClient(memoizeConfig);

      expect(discoverStub).to.have.been.calledOnce;
      expect(clientFirstCall).to.deep.equal(clientSecondCall); // Cached result should be returned
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

  describe("getJWKS", () => {
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
      sandbox.restore(); // Restore sandbox to avoid interference between tests
    });

    it("should memoize JWKS for valid config", async () => {
      const mockJWKS = {
        getKey: async () => ({ kid: "test-kid" }),
      };
      mockCreateRemoteJWKSet.returns(mockJWKS);

      const result1 = await getJWKS(config);
      expect(result1).to.deep.equal(mockJWKS);
      expect(Issuer.discover).to.have.been.calledOnceWith(config.idp_url);
      expect(mockCreateRemoteJWKSet).to.have.been.calledOnceWith(
        new URL(mockIssuer.metadata.jwks_uri),
        {
          headers: { "User-Agent": '"AccountManagement/1.0.0"' },
        }
      );

      const result2 = await getJWKS(config);
      expect(result2).to.deep.equal(mockJWKS);

      expect(Issuer.discover).to.have.been.calledOnce; // Discovery should still be called only once due to caching
      expect(mockCreateRemoteJWKSet).to.have.been.calledOnce; // JWKSet should be created only once
    });

    it("should throw an error if JWKS creation fails", async () => {
      const errorMessage = "Failed to create JWKS";
      mockCreateRemoteJWKSet.throws(new Error(errorMessage));
      const configError = config;
      configError.idp_url = "https://example.jwk.error.com";
      await expect(getJWKS(configError)).to.be.rejectedWith(errorMessage);
    });
  });

  describe("getIssuer", () => {
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
      sandbox.restore(); // Ensure sandbox is restored after each test
    });

    it("should return the issuer when discovered successfully", async () => {
      const mockDiscoveryUri =
        "https://example.com/.well-known/openid-configuration";
      discoverStub.resolves(mockIssuer);

      const issuer = await getIssuer(mockDiscoveryUri);

      expect(discoverStub).to.have.been.calledOnceWith(mockDiscoveryUri);
      expect(issuer).to.equal(mockIssuer);
    });

    it("should throw an error when discovery fails", async () => {
      const mockDiscoveryUri =
        "https://example.com/discover/fails/.well-known/openid-configuration";
      const errorMessage = "Discovery failed";
      discoverStub.rejects(new Error(errorMessage));

      await expect(getIssuer(mockDiscoveryUri)).to.be.rejectedWith(
        errorMessage
      );
    });

    it("should memoize the issuer result", async () => {
      const mockDiscoveryUri =
        "https://example.com/memoize/.well-known/openid-configuration";
      discoverStub.resolves(mockIssuer);

      const issuerFirstCall = await getIssuer(mockDiscoveryUri);
      const issuerSecondCall = await getIssuer(mockDiscoveryUri);

      expect(discoverStub).to.have.been.calledOnceWith(mockDiscoveryUri);
      expect(issuerFirstCall).to.equal(mockIssuer);
      expect(issuerSecondCall).to.equal(mockIssuer);
    });
  });
});
