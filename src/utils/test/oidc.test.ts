import { describe, it, beforeEach } from "mocha";
import { expect } from "chai";
import sinon from "sinon";
import { OIDCConfig } from "../../types";
import { getOIDCClient } from "../oidc";

describe("getOIDCClient", () => {
  let sandbox: sinon.SinonSandbox;
  let constructorStub: sinon.SinonStub;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    constructorStub = sinon.stub();
    sandbox.stub(require("../cache"), "cacheWithExpiration").returns(
      Promise.resolve({
        metadata: {
          jwks_uri: "https://example.com/.well-known/jwks.json",
        },
        Client: class {
          constructor(public config: any) {
            constructorStub(config);
          }
        },
      })
    );
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should create OIDC client with id token signature check when enabled", async () => {
    const config: OIDCConfig = {
      idp_url: "https://example.com/.well-known/openid-configuration",
      client_id: "test-client-id",
      callback_url: "https://example.com/callback",
      scopes: ["openid", "profile", "email"],
    };

    sandbox
      .stub(require("../../config"), "supportIdTokenSignatureCheck")
      .returns(true);

    await getOIDCClient(config);

    expect(constructorStub).to.be.calledOnceWithExactly({
      client_id: "test-client-id",
      redirect_uris: ["https://example.com/callback"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      id_token_signed_response_alg: "ES256",
      scopes: ["openid", "profile", "email"],
      userinfo_signed_response_alg: "ES256",
    });
  });

  it("should create OIDC client without id token signature check when disabled", async () => {
    const config: OIDCConfig = {
      idp_url: "https://example.com/.well-known/openid-configuration",
      client_id: "test-client-id",
      callback_url: "https://example.com/callback",
      scopes: ["openid", "profile", "email"],
    };

    sandbox
      .stub(require("../../config"), "supportIdTokenSignatureCheck")
      .returns(false);

    await getOIDCClient(config);

    expect(constructorStub).to.be.calledOnceWithExactly({
      client_id: "test-client-id",
      redirect_uris: ["https://example.com/callback"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      id_token_signed_response_alg: "ES256",
      scopes: ["openid", "profile", "email"],
    });
  });
});
