import { kmsService } from "../../utils/kms.js";
import { createTimedMemoize } from "../../utils/createTimedMemoize.js";

async function buildJWKS() {
  const publicKey = await kmsService.getPublicKey();
  const keyId = publicKey.KeyId || "";
  const kid = keyId.includes("/") ? keyId.split("/").pop() : keyId;
  
  return {
    keys: [
      {
        kty: "RSA",
        use: "sig",
        kid,
        n: publicKey.PublicKey ? Buffer.from(publicKey.PublicKey).toString("base64url") : undefined,
        e: "AQAB",
      },
    ],
  };
}

export const getJWKS = createTimedMemoize(buildJWKS, 3600000); // 1 hour
