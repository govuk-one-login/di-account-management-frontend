import { createPublicKey } from "node:crypto";
import { exportJWK } from "jose";
import { kmsService } from "../../utils/kms.js";
import { createTimedMemoize } from "../../utils/createTimedMemoize.js";

async function buildJWKS() {
  const publicKey = await kmsService.getPublicKey();
  const keyId = publicKey.KeyId || "";
  const kid = keyId.includes("/") ? keyId.split("/").pop() : keyId;

  if (!publicKey.PublicKey) {
    throw new Error("KMS did not return a public key");
  }

  const keyObject = createPublicKey({
    key: Buffer.from(publicKey.PublicKey),
    format: "der",
    type: "spki",
  });
  const jwk = await exportJWK(keyObject);

  return {
    keys: [{ ...jwk, use: "sig", kid }],
  };
}

export const getJWKS = createTimedMemoize(buildJWKS, 3600000); // 1 hour
