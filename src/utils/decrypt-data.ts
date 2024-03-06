import assert from "assert";
import {
  EncryptionContext,
  KmsKeyringNode,
  buildDecrypt,
} from "@aws-crypto/client-node";
import buildKmsKeyring from "./kms-keyring-builder";
import { logger } from "./logger";

import { getHashedAccessCheckValue } from "./get-access-check-value";
const MAX_ENCRYPTED_DATA_KEY = 5;
const DECODING = "utf8";

const ENCODING = "base64";
const decryptClientConfig = { maxEncryptedDataKeys: MAX_ENCRYPTED_DATA_KEY };

const decryptClient = buildDecrypt(decryptClientConfig);

let keyring: KmsKeyringNode;

export async function generateExpectedContext(
  userId: string
): Promise<EncryptionContext> {
  const { AWS_REGION, ACCOUNT_ID, ENVIRONMENT, VERIFY_ACCESS_VALUE } =
    process.env;

  let accessCheckValue;
  try {
    assert(AWS_REGION, "Missing AWS_REGION environment variable");
    assert(ACCOUNT_ID, "Missing ACCOUNT_ID environment variable");
    assert(ENVIRONMENT, "Missing ENVIRONMENT environment variable");
    assert(
      VERIFY_ACCESS_VALUE,
      "Missing VERIFY_ACCESS_VALUE environment variable"
    );
    accessCheckValue = await getHashedAccessCheckValue(VERIFY_ACCESS_VALUE);
  } catch (error) {
    logger.error(error.message);
  }

  return {
    origin: AWS_REGION,
    accountId: ACCOUNT_ID,
    stage: ENVIRONMENT,
    userId,
    accessCheckValue,
  };
}

export function validateEncryptionContext(
  context: EncryptionContext,
  expected: EncryptionContext
): void {
  if (context === undefined || Object.keys(context).length === 0) {
    logger.error("Encryption context is empty or undefined");
  }

  Object.keys(expected).forEach((key) => {
    if (context[key] !== expected[key]) {
      logger.error(`Encryption context mismatch: ${key}`);
    }
  });
}

export async function decryptData(
  data: string,
  userId: string,
  traceId: string
): Promise<string> {
  try {
    logger.debug({
      trace: "decryptData",
      message: "uid",
      userId,
    });
    keyring ??= await buildKmsKeyring();
    const result = await decryptClient.decrypt(
      keyring,
      Buffer.from(data, ENCODING)
    );
    validateEncryptionContext(
      result.messageHeader.encryptionContext,
      await generateExpectedContext(userId)
    );
    return result.plaintext.toString(DECODING);
  } catch (error) {
    logger.error(
      { err: error, trace: traceId },
      "Could not decrypt data, returning original data and not throwing an error."
    );
    return data;
  }
}
