import crypto from "node:crypto";

const SecretValueAlgorithm = "sha256";
const SecretValueEncoding = "hex";

const getHashedAccessCheckValue = async (
  accessCheckValue: string
): Promise<string> => {
  return crypto
    .createHash(SecretValueAlgorithm)
    .update(accessCheckValue)
    .digest(SecretValueEncoding);
};

export { getHashedAccessCheckValue };
