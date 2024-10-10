import { Issuer, Client, custom, generators } from "openid-client";
import { OIDCConfig } from "../types";
import { ClientAssertionServiceInterface, KmsService } from "./types";
import { kmsService } from "./kms";
import base64url from "base64url";
import random = generators.random;
import { decodeJwt, createRemoteJWKSet } from "jose";
import { logger } from "./logger";

custom.setHttpOptionsDefaults({
  timeout: 20000,
});

// Cache entry with metadata
interface CacheEntry<T> {
  value: T;
  lastAccessed: number;
}

class Cache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private ttl: number; // Time to live for cache entries in milliseconds

  constructor(ttl: number) {
    this.ttl = ttl;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      // Update last accessed time
      entry.lastAccessed = Date.now();
      logger.info(`Cache hit for key: ${key}`);
      return entry.value;
    }
    logger.info(`Cache miss for key: ${key}`);
    return undefined;
  }

  set(key: string, value: T) {
    logger.info(`Storing value in cache with key: ${key}`);
    this.cache.set(key, { value, lastAccessed: Date.now() });
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  cleanUp() {
    const now = Date.now();
    this.cache.forEach((entry, key) => {
      if (now - entry.lastAccessed > this.ttl) {
        logger.info(`Removing stale cache entry for key: ${key}`);
        this.cache.delete(key);
      }
    });
  }
}

// Configure cache with a TTL of 5 minutes (300,000 milliseconds)
const issuerCache = new Cache<Issuer>(300000);
const oidcClientCache = new Cache<Client>(300000);
const jwksCache = new Cache<any>(300000);

// Polling function to check if the cached value has changed
async function pollCacheForChanges<T>(
  cache: Cache<T>,
  key: string,
  fetchLatestValue: () => Promise<T>,
  initialInterval = 15000 // Start with 15 seconds
) {
  let isFetching = false;
  let currentInterval = initialInterval;

  const intervalId = setInterval(async () => {
    if (isFetching) return; // Prevent concurrent fetches
    isFetching = true;

    try {
      const currentValue = cache.get(key);
      const latestValue = await fetchLatestValue();

      if (JSON.stringify(currentValue) !== JSON.stringify(latestValue)) {
        logger.info(`Value for key ${key} has changed. Updating cache.`);
        cache.set(key, latestValue);
        // Reset polling interval to a shorter duration on change
        currentInterval = Math.max(5000, currentInterval / 2); // Minimum interval of 5 seconds
      } else {
        logger.info(`Value for key ${key} remains unchanged.`);
        // Increment the polling interval when no change
        currentInterval = Math.min(60000, currentInterval * 2); // Maximum interval of 60 seconds
      }

      // Clear and set new interval
      clearInterval(intervalId);
      pollCacheForChanges(cache, key, fetchLatestValue, currentInterval); // Recursive call with new interval
    } catch (error) {
      logger.error(`Error fetching latest value for key ${key}: ${error}`);
    } finally {
      isFetching = false;
    }
  }, currentInterval);
}

// Periodically clean up stale cache entries every 10 minutes
setInterval(() => {
  issuerCache.cleanUp();
  oidcClientCache.cleanUp();
  jwksCache.cleanUp();
}, 600000); // 10 minutes in milliseconds

// Get Issuer and start polling for changes
async function getIssuer(discoveryUri: string) {
  const cachedIssuer = issuerCache.get(discoveryUri);
  if (cachedIssuer) return cachedIssuer;

  const issuer = await Issuer.discover(discoveryUri);
  issuerCache.set(discoveryUri, issuer);

  // Start polling to check if the issuer has changed
  pollCacheForChanges(issuerCache, discoveryUri, () =>
    Issuer.discover(discoveryUri)
  );

  return issuer;
}

// Get OIDC Client and start polling for changes
async function getOIDCClient(config: OIDCConfig): Promise<Client> {
  const cacheKey = `${config.idp_url}-${config.client_id}`;
  const cachedClient = oidcClientCache.get(cacheKey);
  if (cachedClient) return cachedClient;

  const issuer = await getIssuer(config.idp_url);
  const client = new issuer.Client({
    client_id: config.client_id,
    redirect_uris: [config.callback_url],
    response_types: ["code"],
    token_endpoint_auth_method: "none", // Allows for a custom client_assertion
    id_token_signed_response_alg: "ES256",
    scopes: config.scopes,
  });

  oidcClientCache.set(cacheKey, client);

  // Start polling to check if the OIDC client has changed
  pollCacheForChanges(oidcClientCache, cacheKey, () => getOIDCClient(config));

  return client;
}

// Get JWKS and start polling for changes
async function getJWKS(config: OIDCConfig) {
  const cacheKey = config.idp_url;
  const cachedJwks = jwksCache.get(cacheKey);
  if (cachedJwks) return cachedJwks;

  const issuer = await getIssuer(config.idp_url);
  const remoteJWKSet = createRemoteJWKSet(new URL(issuer.metadata.jwks_uri), {
    headers: { "User-Agent": '"AccountManagement/1.0.0"' },
  });
  jwksCache.set(cacheKey, remoteJWKSet);

  // Start polling to check if the JWKS has changed
  pollCacheForChanges(jwksCache, cacheKey, () => getJWKS(config));

  return remoteJWKSet;
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
