import { Issuer, Client, custom, generators } from "openid-client";
import { OIDCConfig } from "../types";
import { ClientAssertionServiceInterface, KmsService } from "./types";
import { kmsService } from "./kms";
import base64url from "base64url";
import random = generators.random;
import { decodeJwt, createRemoteJWKSet } from "jose";
import { cacheWithExpiration } from "./cache";
import { Request } from "express";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { retryableFunction } from "./retryableFunction";
import { ERROR_MESSAGES, OIDC_ERRORS } from "../app.constants";
import { supportIdTokenSignatureCheck } from "../config";

const issuerCacheDuration = 24 * 60 * 60 * 1000;
const jwksRefreshInterval = 24 * 60 * 60 * 1000;

custom.setHttpOptionsDefaults({
  timeout: 20000,
});

async function getCachedIssuer(discoveryUri: string): Promise<Issuer<Client>> {
  const cacheKey = `oidc:issuer:${discoveryUri.toLowerCase()}`;
  return await cacheWithExpiration(
    cacheKey,

    () => Issuer.discover(discoveryUri),
    issuerCacheDuration
  );
}

async function getOIDCClient(config: OIDCConfig): Promise<Client> {
  let issuer;
  try {
    issuer = await getCachedIssuer(config.idp_url);
  } catch {
    throw new Error(OIDC_ERRORS.OIDC_DISCOVERY_UNAVAILABLE);
  }

  const extraConfig = supportIdTokenSignatureCheck()
    ? { userinfo_signed_response_alg: "ES256" }
    : {};

  return new issuer.Client({
    client_id: config.client_id,
    redirect_uris: [config.callback_url],
    response_types: ["code"],
    token_endpoint_auth_method: "none", //allows for a custom client_assertion
    id_token_signed_response_alg: "ES256",
    scopes: config.scopes,
    ...extraConfig,
  });
}

async function getCachedJWKS(config: OIDCConfig) {
  const issuer = await getCachedIssuer(config.idp_url);
  const issuerUrl = issuer.metadata.jwks_uri;
  const cacheKey = `oidc:jwks:${issuerUrl.toLowerCase()}`;
  return await cacheWithExpiration(
    cacheKey,
    async () => {
      const remoteJWKSet = createRemoteJWKSet(new URL(issuerUrl), {
        headers: { "User-Agent": "AccountManagement/1.0.0" },
      });
      return remoteJWKSet;
    },
    jwksRefreshInterval
  );
}

function isTokenExpired(token: string): boolean {
  const decodedToken = decodeJwt(token);

  const next60Seconds = new Date();
  next60Seconds.setSeconds(60);

  return decodedToken.exp < next60Seconds.getTime() / 1000;
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

const initRefreshToken = function (
  clientAssertionService: ClientAssertionServiceInterface = clientAssertionGenerator()
) {
  return async function (req: Request) {
    const accessToken = req.session.user.tokens.accessToken;

    if (isTokenExpired(accessToken)) {
      try {
        const clientAssertion =
          await clientAssertionService.generateAssertionJwt(
            req.oidc.metadata.client_id,
            req.oidc.issuer.metadata.token_endpoint
          );

        const tokenSet = await retryableFunction(
          req.oidc.refresh.bind(req.oidc) as typeof req.oidc.refresh,
          [
            req.session.user.tokens.refreshToken,
            {
              exchangeBody: {
                client_assertion_type:
                  "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                client_assertion: clientAssertion,
              },
            },
          ]
        );
        req.session.user.tokens.accessToken = tokenSet.access_token;
        req.session.user.tokens.refreshToken = tokenSet.refresh_token;
      } catch {
        req.metrics?.addMetric("refreshTokenError", MetricUnit.Count, 1);
        throw new Error(ERROR_MESSAGES.FAILED_TO_REFRESH_TOKEN);
      }
    }
  };
};

const refreshToken = initRefreshToken();

export {
  getOIDCClient,
  getCachedJWKS,
  isTokenExpired,
  clientAssertionGenerator,
  getCachedIssuer,
  initRefreshToken,
  refreshToken,
};
