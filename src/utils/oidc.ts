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

const clientAssertionGenerator = (
  kms: KmsService = kmsService
): ClientAssertionServiceInterface => ({
  generateAssertionJwt: async (
    clientId: string,
    tokenEndpointUri: string
  ): Promise<string> => {
    const headers = { alg: "RS512", typ: "JWT" };
    const payload = {
      iss: clientId,
      sub: clientId,
      aud: tokenEndpointUri,
      exp: Math.floor(Date.now() / 1000) + 5 * 60, // Expire in 5 minutes
      iat: Math.floor(Date.now() / 1000),
      jti: random(),
    };
    const encodedHeader = base64url.encode(JSON.stringify(headers));
    const encodedPayload = base64url.encode(JSON.stringify(payload));
    const message = `${encodedHeader}.${encodedPayload}`;
    const sig = await kms.sign(message);
    const base64Signature = Buffer.from(sig.Signature)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    return `${encodedHeader}.${encodedPayload}.${base64Signature}`;
  },
});

export {
  getOIDCClient,
  cachedJwks as getJWKS,
  isTokenExpired,
  clientAssertionGenerator,
  cachedIssuer as getIssuer,
};
