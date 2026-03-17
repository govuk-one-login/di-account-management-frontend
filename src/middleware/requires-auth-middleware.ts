import { NextFunction, Request, Response } from "express";
import { generators } from "openid-client";
import {
  PATH_DATA,
  VECTORS_OF_TRUST,
  CODE_CHALLENGE_VALUES,
} from "../app.constants.js";
import { logger } from "../utils/logger.js";
import { kmsService } from "../utils/kms.js";
import base64url from "base64url";
import { getOIDCApiDiscoveryUrl, getPkceEnabled } from "../config.js";
import { getKMSConfig } from "../config/aws.js";
import { getRandomValues, subtle } from "node:crypto";

export async function requiresAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const isAuthenticated = req.session.user?.isAuthenticated;
  const isLoggedOut = req.cookies?.lo;

  logger.info(
    { trace: res.locals.trace },
    `isAuthenticated = ${isAuthenticated} , isLoggedOut = ${isLoggedOut}`
  );
  // if there is no session, then should create a session and redirect to auth to sign in
  if (isAuthenticated === undefined) {
    req.session.currentURL = req.url;
    await redirectToLogIn(req, res);
  } else if (!isAuthenticated && isLoggedOut == "true") {
    return res.redirect(PATH_DATA.USER_SIGNED_OUT.url);
  } else if (!isAuthenticated) {
    return res.redirect(PATH_DATA.SESSION_EXPIRED.url);
  } else {
    res.locals.isUserLoggedIn = true;
    res.cookie("lo", "false");
    next();
  }
}

export async function redirectToLogIn(
  req: Request,
  res: Response
): Promise<void> {
  req.session.nonce = generators.nonce(15);
  req.session.state = generators.nonce(10);
  const authorizationUrl = await generateAuthUrl(req);

  return res.redirect(authorizationUrl);
}

async function generateAuthUrl(req: Request): Promise<string> {
  const baseParams = {
    client_id: req.oidc.metadata.client_id,
    response_type: "code",
    scope: req.oidc.metadata.scopes as string,
  };
  let codeVerifier, codeChallenge;
  if (getPkceEnabled()) {
    codeVerifier = generateCodeVerifier();
    codeChallenge = await generateCodeChallenge(codeVerifier);
    req.session.user.code_verifier = codeVerifier;
  }

  const keyId = getKMSConfig().kmsKeyId;
  const kid = keyId.includes("/") ? keyId.split("/").pop() : keyId;
  const headers = { alg: "RS512", typ: "JWT", kid };
  const claims = {
    aud: `${getOIDCApiDiscoveryUrl()}/authorize`,
    iss: req.oidc.metadata.client_id,
    ...baseParams,
    redirect_uri: req.oidc.metadata.redirect_uris[0],
    state: req.session.state,
    nonce: req.session.nonce,
    vtr: JSON.stringify([VECTORS_OF_TRUST.MEDIUM]),
    cookie_consent: req.query.cookie_consent,
    _ga: req.query._ga,
    code_challenge_method: codeChallenge
      ? CODE_CHALLENGE_VALUES.CODE_CHALLENGE_METHOD
      : undefined,
    code_challenge: codeChallenge,
  };
  const encodedHeader = base64url.default.encode(JSON.stringify(headers));
  const encodedPayload = base64url.default.encode(JSON.stringify(claims));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const sig = await kmsService.sign(unsignedToken);
  const base64Signature = Buffer.from(sig.Signature)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return req.oidc?.authorizationUrl({
    ...baseParams,
    request: `${unsignedToken}.${base64Signature}`,
  });
}

function generateCodeVerifier(): string {
  const cryptoArray = new Uint8Array(
    CODE_CHALLENGE_VALUES.CODE_VERIFIER_LENGTH
  );
  getRandomValues(cryptoArray);

  let codeVerifier = "";
  for (let x = 0; x < CODE_CHALLENGE_VALUES.CODE_VERIFIER_LENGTH; x++) {
    codeVerifier += CODE_CHALLENGE_VALUES.CODE_VERIFIER_CHAR_SET.charAt(
      cryptoArray[x] % CODE_CHALLENGE_VALUES.CODE_VERIFIER_CHAR_SET.length
    );
  }

  return codeVerifier;
}
async function generateCodeChallenge(verifier: string): Promise<string> {
  const verifierBuffer = new TextEncoder().encode(verifier);

  const hashBuffer = await subtle.digest("SHA-256", verifierBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashString = String.fromCodePoint(...hashArray);

  const base64binary = Buffer.from(hashString, "base64");
  const codeChallengeString = base64binary.toString();

  return codeChallengeString
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
