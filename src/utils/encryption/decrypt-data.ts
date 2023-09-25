import {
  EncryptionContext,
  KmsKeyringNode,
  buildDecrypt,
} from "@aws-crypto/client-node";
import buildKmsKeyring from "./kms-keyring-builder";

const MAX_ENCRYPTED_DATA_KEY = 5;
const DECODING = "utf8";

const decryptClientConfig = { maxEncryptedDataKeys: MAX_ENCRYPTED_DATA_KEY };
const decryptClient = buildDecrypt(decryptClientConfig);

let keyring: KmsKeyringNode;

export function generateExpectedContext(userId: string): EncryptionContext {
  const { AWS_REGION, ACCOUNT_ID, ENVIRONMENT } = process.env;
  if (AWS_REGION === undefined) {
    throw new Error("Missing AWS_REGION environment variable");
  }

  if (ACCOUNT_ID === undefined) {
    throw new Error("Missing ACCOUNT_ID environment variable");
  }

  if (ENVIRONMENT === undefined) {
    throw new Error("Missing ENVIRONMENT environment variable");
  }

  return {
    origin: AWS_REGION,
    accountId: ACCOUNT_ID,
    stage: ENVIRONMENT,
    userId,
  };
}

export function validateEncryptionContext(
  context: EncryptionContext,
  expected: EncryptionContext
): void {
  if (context === undefined || Object.keys(context).length === 0) {
    throw new Error("Encryption context is empty or undefined");
  }

  Object.keys(expected).forEach((key) => {
    if (context[key] !== expected[key]) {
      throw new Error(`Encryption context mismatch: ${key}`);
    }
  });
}

export async function decryptData(
  data: string,
  userId: string
): Promise<string> {
  try {
    keyring ??= await buildKmsKeyring();
    const result = await decryptClient.decrypt(keyring, data);
    validateEncryptionContext(
      result.messageHeader.encryptionContext,
      generateExpectedContext(userId)
    );
    return result.plaintext.toString(DECODING);
  } catch (error) {
    console.error("Failed to decrypt data.", { error });
    throw error;
  }
}
