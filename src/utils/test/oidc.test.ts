import { describe, it, beforeEach, expect, vi, afterEach } from "vitest";
import { OIDCConfig } from "../../types";
import { getOIDCClient } from "../oidc.js";
import { Issuer } from "openid-client";

describe("getOIDCClient", () => {
  let constructorStub: ReturnType<typeof vi.fn>;
  let mockIssuer: any;

  beforeEach(() => {
    constructorStub = vi.fn();

    mockIssuer = {
      metadata: {
        jwks_uri: "https://example.com/.well-known/jwks.json",
      },
      Client: class {
        constructor(public config: any) {
          constructorStub(config);
        }
      },
    };

    vi.spyOn(Issuer, "discover").mockResolvedValue(mockIssuer);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create OIDC client with id token signature check", async () => {
    const config: OIDCConfig = {
      idp_url: "https://example.com/.well-known/openid-configuration",
      client_id: "test-client-id",
      callback_url: "https://example.com/callback",
      scopes: ["openid", "profile", "email"],
    };

    await getOIDCClient(config);

    expect(constructorStub).toHaveBeenCalledOnce();
    expect(constructorStub).toHaveBeenCalledWith({
      client_id: "test-client-id",
      redirect_uris: ["https://example.com/callback"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      id_token_signed_response_alg: "ES256",
      scopes: ["openid", "profile", "email"],
    });
  });
});
