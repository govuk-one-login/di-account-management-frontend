import base64url from "base64url";
import { generators } from "openid-client";
import random = generators.random;
import { CallbackServiceInterface } from "./types";
import { kmsService } from "../../utils/kms";
import { KmsService } from "../../utils/types";

export function callbackService(
  kms: KmsService = kmsService()
): CallbackServiceInterface {
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

    return (
      token_components.header +
      "." +
      token_components.payload +
      "." +
      sig.Signature.toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "")
    );
  };

  return {
    generateAssertionJwt,
  };
}
