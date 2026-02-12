import { describe, it, expect } from "vitest";
import { KmsKeyringNode } from "@aws-crypto/client-node";
import buildKmsKeyring from "../kms-keyring-builder.js";

const exampleArn =
  "arn:aws:kms:eu-west-2:111122223333:key/bc436485-5092-42b8-92a3-0aa8b93536dc";

describe("kmsKeyringBuilder", () => {
  /*
  Test order is important as once the wrapping keys have been validated,
  buildKmsKeyring will not do so again.
  */

  it("throws error when wrapper key is not valid ARN", async () => {
    process.env.GENERATOR_KEY_ARN = exampleArn;
    process.env.WRAPPING_KEY_ARN = "not-valid-arn";

    await expect(buildKmsKeyring()).rejects.toThrow(
      "Invalid configuration - ARN for main envelope encryption wrapping key is invalid."
    );
  });

  it("throws error when wrapper key is not defined", async () => {
    process.env.GENERATOR_KEY_ARN = exampleArn;
    delete process.env.WRAPPING_KEY_ARN;

    await expect(buildKmsKeyring()).rejects.toThrow(
      "Invalid configuration - ARN for main envelope encryption wrapping key is undefined."
    );
  });

  it("throws error when generator key is not present", async () => {
    delete process.env.GENERATOR_KEY_ARN;
    process.env.WRAPPING_KEY_ARN = exampleArn;

    await expect(buildKmsKeyring()).rejects.toThrow(
      "Invalid configuration - ARN for envelope encryption Generator key is undefined"
    );
  });

  it("throws error when generator key is not valid ARN", async () => {
    process.env.GENERATOR_KEY_ARN = "not-valid-arn";
    process.env.WRAPPING_KEY_ARN = exampleArn;

    await expect(buildKmsKeyring()).rejects.toThrow(
      "Invalid configuration - ARN for envelope encryption Generator key is invalid."
    );
  });

  it("construct KmsKeyring correctly", async () => {
    process.env.GENERATOR_KEY_ARN = exampleArn;
    process.env.WRAPPING_KEY_ARN = exampleArn;

    const kmsKeyring: KmsKeyringNode = await buildKmsKeyring();
    expect(kmsKeyring.keyIds).toHaveLength(1);
    expect(kmsKeyring.generatorKeyId).toEqual(exampleArn);
    expect(kmsKeyring.keyIds[0]).toEqual(exampleArn);
  });
});
