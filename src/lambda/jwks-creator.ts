import { exportJWK, importSPKI } from "jose";
import type { JWK } from "jose";
import type { Context, CloudFormationCustomResourceEvent } from "aws-lambda";
import { createPublicKey } from "node:crypto";
import assert from "node:assert";
import { s3Client } from "../config/aws.js";
import { kmsService } from "../utils/kms.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { jarKeyEncryptionAlgorithm } from "../app.constants.js";
import { logger } from "../utils/logger.js";

export const handler = async (
  event: CloudFormationCustomResourceEvent,
  context: Context
): Promise<void> => {
  try {
    if (event.RequestType === "Create" || event.RequestType === "Update") {
      assert.ok(
        process.env["JAR_RSA_ENCRYPTION_KEY_ALIAS"],
        "JAR_RSA_ENCRYPTION_KEY_ALIAS not sett"
      );

      const jwks = await generateJwksFromKmsPublicKey(
        process.env["JAR_RSA_ENCRYPTION_KEY_ALIAS"]
      );

      await putContentToS3(JSON.stringify(jwks));
    }

    await sendResponse(event, context, "SUCCESS");
  } catch (error) {
    logger.error(`Error in handler: ${error}`);
    await sendResponse(
      event,
      context,
      "FAILED",
      error instanceof Error ? error : undefined
    );
  }
};

async function sendResponse(
  event: CloudFormationCustomResourceEvent,
  context: Context,
  status: "SUCCESS" | "FAILED",
  error?: Error
): Promise<void> {
  const responseBody = JSON.stringify({
    Status: status,
    Reason: error?.message,
    PhysicalResourceId: context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
  });

  const response = await fetch(event.ResponseURL, {
    method: "PUT",
    headers: { "Content-Type": "" },
    body: responseBody,
  });

  if (!response.ok) {
    throw new Error(`Failed to send response: ${response.statusText}`);
  }
}

async function generateJwksFromKmsPublicKey(
  keyAlias: string
): Promise<{ keys: JWK[] }> {
  try {
    logger.info("Getting Public Key using Alias: " + keyAlias);

    const { PublicKey } = await kmsService.getPublicKey({
      KeyId: keyAlias,
    });

    if (!PublicKey) {
      throw new Error(`Public key not found for KMS Key Alias: ${keyAlias}`);
    }

    logger.info(`Public key material: ${PublicKey}`);

    const { KeyMetadata } = await kmsService.describeKey({
      KeyId: keyAlias,
    });

    if (!KeyMetadata) {
      throw new Error(`Key ID not found for KMS Key Alias: ${keyAlias}`);
    }

    logger.info(`Key Metadata: ${JSON.stringify(KeyMetadata)}`);

    const pem = createPublicKey({
      key: Buffer.from(PublicKey),
      format: "der",
      type: "spki",
    })
      .export({
        format: "pem",
        type: "spki",
      })
      .toString();

    logger.info(`Created PEM: ${pem}`);

    const cryptoKey = await importSPKI(pem, jarKeyEncryptionAlgorithm);
    const jwk = await exportJWK(cryptoKey);

    assert.ok(KeyMetadata.KeyId, "KeyMetadata.KeyId not defined");

    jwk.kid = KeyMetadata.KeyId;
    jwk.alg = jarKeyEncryptionAlgorithm;
    jwk.use = "enc";

    logger.info(`JWK ${JSON.stringify(jwk)}`);

    return {
      keys: [jwk],
    };
  } catch (error) {
    logger.error(`Error generating JWKS from KMS public key: ${error}`);
    throw error;
  }
}

async function putContentToS3(content: string) {
  assert.ok(process.env["BUCKET_NAME"], "BUCKET_NAME not set");

  const key = "jwks.json";

  try {
    const response = await s3Client.getClient().send(
      new PutObjectCommand({
        Bucket: process.env["BUCKET_NAME"],
        Key: key,
        Body: content,
        ContentType: "application/json",
      })
    );

    logger.info(
      `Successfully uploaded JWKS to S3, Bucket: ${process.env["BUCKET_NAME"]}, Key: ${key}`
    );
    return response;
  } catch (err) {
    logger.error(`Failed to upload to S3: ${err}`);
    throw err;
  }
}
