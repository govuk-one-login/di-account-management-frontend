import { getKMSConfig } from "../config/aws.js";
import { kmsService } from "./kms.js";
import { randomUUID } from "node:crypto";
import {
  getAmcAuthorizeUrl,
  getAmcClientId,
  getAmcJwksUrl,
  getHomeBaseUrl,
} from "../config.js";
import * as jose from "jose";
import { PATH_DATA } from "../app.constants.js";

export const getAmcJwe = async (
  scope: string,
  state: string,
  user: {
    internalPairwiseId: string;
    publicSubjectId: string;
    email: string;
  },
  account_management_api_access_token?: string,
  account_data_api_access_token?: string
) => {
  const keyId = getKMSConfig().kmsKeyId;
  const kid = keyId.includes("/") ? keyId.split("/").pop() : keyId;
  const headers = { alg: "RS512", typ: "JWT", kid };

  const payload = {
    client_id: getAmcClientId(),
    iss: getAmcClientId(),
    aud: getAmcAuthorizeUrl(),
    exp: Math.floor(Date.now() / 1000) + 120, // Expire in 2 minutes
    iat: Math.floor(Date.now() / 1000),
    jti: randomUUID(),
    account_management_api_access_token,
    account_data_api_access_token,
    response_type: "code",
    scope,
    email: user.email,
    public_sub: user.publicSubjectId,
    sub: user.internalPairwiseId,
    state,
    redirect_uri: getHomeBaseUrl() + PATH_DATA.AMC_CALLBACK.url,
  };

  const encodedHeader = jose.base64url.encode(JSON.stringify(headers));
  const encodedPayload = jose.base64url.encode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const { Signature } = await kmsService.sign(signingInput);
  const encodedSignature = jose.base64url.encode(Signature);
  const jws = `${signingInput}.${encodedSignature}`;

  const jwksUrl = new URL(getAmcJwksUrl());
  const jwksResponse = await fetch(jwksUrl);
  if (!jwksResponse.ok) {
    throw new Error(
      `Failed to fetch JWKS from ${jwksUrl.toString()}: ${jwksResponse.status} ${jwksResponse.statusText}`,
    );
  }
  const jwks = await jwksResponse.json();
  if (!jwks || !Array.isArray(jwks.keys)) {
    throw new Error("Invalid JWKS: 'keys' array is missing or malformed");
  }
  const encryptionJWK = jwks.keys.find((key: any) => key.use === "enc");
  if (!encryptionJWK) {
    throw new Error("No encryption key (use === 'enc') found in JWKS");
  }
  const publicKey = await jose.importJWK(encryptionJWK, encryptionJWK.alg);

  const jwe = await new jose.CompactEncrypt(new TextEncoder().encode(jws))
    .setProtectedHeader({
      alg: encryptionJWK.alg,
      kid: encryptionJWK.kid,
      enc: "A256GCM",
    })
    .encrypt(publicKey);

  return {
    jws,
    jwe,
  };
};
