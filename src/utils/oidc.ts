import { Issuer, Client, custom, generators } from "openid-client";
import { OIDCConfig } from "../types";
import memoize from "fast-memoize";
import { ClientAssertionServiceInterface, KmsService } from "./types";
import { kmsService } from "./kms";
import base64url from "base64url";
import random = generators.random;
import { decodeJwt, createRemoteJWKSet } from "jose";

custom.setHttpOptionsDefaults({
  timeout: 20000,
});

async function getIssuer(discoveryUri: string) {
  return await Issuer.discover(discoveryUri);
}

const cachedIssuer = memoize(getIssuer);

async function getOIDCClient(config: OIDCConfig): Promise<Client> {
  const issuer = await cachedIssuer(config.idp_url);

  return new issuer.Client({
    client_id: config.client_id,
    redirect_uris: [config.callback_url],
    response_types: ["code"],
    token_endpoint_auth_method: "none", //allows for a custom client_assertion
    id_token_signed_response_alg: "ES256",
    scopes: config.scopes,
  });
}

const cachedOIDCClient = memoize(getOIDCClient);

async function getJWKS(config: OIDCConfig) {
  const issuer = await cachedIssuer(config.idp_url);
  return createRemoteJWKSet(new URL(issuer.metadata.jwks_uri), {
    headers: { "User-Agent": '"AccountManagement/1.0.0"' },
  });
}

const cachedJwks = memoize(getJWKS);

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

export {
  cachedOIDCClient as getOIDCClient,
  cachedJwks as getJWKS,
  isTokenExpired,
  clientAssertionGenerator,
  cachedIssuer as getIssuer,
};
