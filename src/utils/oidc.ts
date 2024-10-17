import { Issuer, Client, custom, generators, BaseClient } from "openid-client";
import { OIDCConfig } from "../types";
import { ClientAssertionServiceInterface, KmsService } from "./types";
import { kmsService } from "./kms";
import base64url from "base64url";
import random = generators.random;
import {
  decodeJwt,
  createRemoteJWKSet,
  FlattenedJWSInput,
  JSONWebKeySet,
  JWSHeaderParameters,
  KeyLike,
} from "jose";

custom.setHttpOptionsDefaults({
  timeout: 20000,
});

let issuer: Issuer<BaseClient> = null;

async function getIssuer(discoveryUri: string) {
  if (issuer == null) {
    issuer = await Issuer.discover(discoveryUri);
  }
  return issuer;
}

let oidcClient: Client = null;

async function getOIDCClient(config: OIDCConfig): Promise<Client> {
  const issuer = await getIssuer(config.idp_url);
  if (oidcClient == null) {
    oidcClient = new issuer.Client({
      client_id: config.client_id,
      redirect_uris: [config.callback_url],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      id_token_signed_response_alg: "ES256",
      scopes: config.scopes,
    });
  }
  return oidcClient;
}

let jwks: {
  (
    protectedHeader?: JWSHeaderParameters,
    token?: FlattenedJWSInput
  ): Promise<KeyLike>;
  coolingDown: boolean;
  fresh: boolean;
  reloading: boolean;
  reload: () => Promise<void>;
  jwks: () => JSONWebKeySet | undefined;
} = null;

async function getJWKS(config: OIDCConfig) {
  const issuer = await getIssuer(config.idp_url);

  if (jwks == null) {
    jwks = createRemoteJWKSet(new URL(issuer.metadata.jwks_uri), {
      headers: { "User-Agent": '"AccountManagement/1.0.0"' },
    });
  }
  return jwks;
}

function isTokenExpired(token: string): boolean {
  const decodedToken = decodeJwt(token);

  const next60Seconds = new Date();
  next60Seconds.setSeconds(60);

  return (decodedToken.exp as number) < next60Seconds.getTime() / 1000;
}

function clientAssertionGenerator(
  kms: KmsService = kmsService()
): ClientAssertionServiceInterface {
  const generateAssertionJwt = async function (
    clientId: string,
    tokenEndpointUri: string
  ): Promise<string> {
    const headers = {
      alg: "RS512",
      typ: "JWT",
    };

    const payload = {
      iss: clientId,
      sub: clientId,
      aud: tokenEndpointUri,
      exp: Math.floor((new Date().getTime() + 5 * 60000) / 1000),
      iat: Math.floor(new Date().getTime() / 1000),
      jti: random(),
    };

    const token_components = {
      header: base64url.encode(JSON.stringify(headers)),
      payload: base64url.encode(JSON.stringify(payload)),
    };

    const message = Buffer.from(
      token_components.header + "." + token_components.payload
    ).toString();

    const sig = await kms.sign(message);

    const base64Signature = Buffer.from(sig.Signature).toString("base64");
    return (
      token_components.header +
      "." +
      token_components.payload +
      "." +
      base64Signature.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
    );
  };

  return {
    generateAssertionJwt,
  };
}

export { getOIDCClient, getJWKS, isTokenExpired, clientAssertionGenerator };
