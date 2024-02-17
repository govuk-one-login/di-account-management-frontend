import {
  EncryptionContext,
  KmsKeyringNode,
  buildDecrypt,
} from "@aws-crypto/client-node";
import buildKmsKeyring from "./kms-keyring-builder";
import { logger } from "./logger";

const MAX_ENCRYPTED_DATA_KEY = 5;
const DECODING = "utf8";
const ENCODING = "base64";

const decryptClientConfig = { maxEncryptedDataKeys: MAX_ENCRYPTED_DATA_KEY };
const decryptClient = buildDecrypt(decryptClientConfig);

let keyring: KmsKeyringNode;

export function generateExpectedContext(userId: string): EncryptionContext {
  const { AWS_REGION, ACCOUNT_ID, ENVIRONMENT, VERIFY_ACCESS_VALUE } =
    process.env;
  if (AWS_REGION === undefined) {
    throw new Error("Missing AWS_REGION environment variable");
  }

  if (ACCOUNT_ID === undefined) {
    throw new Error("Missing ACCOUNT_ID environment variable");
  }

  if (ENVIRONMENT === undefined) {
    throw new Error("Missing ENVIRONMENT environment variable");
  }

  if (VERIFY_ACCESS_VALUE === undefined) {
    throw new Error("Missing VERIFY_ACCESS_VALUE environment variable");
  }

  return {
    origin: AWS_REGION,
    accountId: ACCOUNT_ID,
    stage: ENVIRONMENT,
    userId,
    accessCheckValue: VERIFY_ACCESS_VALUE,
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
    const result = await decryptClient.decrypt(
      keyring,
      Buffer.from(data, ENCODING)
    );
    validateEncryptionContext(
      result.messageHeader.encryptionContext,
      generateExpectedContext(userId)
    );
    logger.info({ trace: "decryptData" }, result.plaintext.toString(DECODING));
    return result.plaintext.toString(DECODING);
  } catch (error) {
    logger.error("Failed to decrypt data.", { error });
    throw error;
  }
}
