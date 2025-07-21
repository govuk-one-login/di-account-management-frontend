import crypto from "node:crypto";

const SecretValueAlgorithm = "sha256"; //pragma: allowlist secret
const SecretValueEncoding = "hex"; //pragma: allowlist secret

const getHashedAccessCheckValue = async (
  accessCheckValue: string
): Promise<string> => {
  return crypto
    .createHash(SecretValueAlgorithm)
    .update(accessCheckValue)
    .digest(SecretValueEncoding);
};

export { getHashedAccessCheckValue };
