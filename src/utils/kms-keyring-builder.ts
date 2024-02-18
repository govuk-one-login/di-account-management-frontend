import { KmsKeyringNode } from "@aws-crypto/client-node";

export interface KMSKeyRingConfig {
  generatorKeyId?: string;
  keyIds: string[];
}

const AWS_ARN_PREFIX = "^arn:aws:";
const RegexpKMSKeyArn = new RegExp(
  `${AWS_ARN_PREFIX}kms:\\w+(?:-\\w+)+:\\d{12}:key\\/[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+$`
);

let kmsKeyRingConfig: KMSKeyRingConfig;

function formWrappingKeysArray(wrappingKeyArn?: string): string[] {
  if (!wrappingKeyArn) {
    throw new TypeError(
      "Invalid configuration - ARN for main envelope encryption wrapping key is undefined."
    );
  }
  if (!RegexpKMSKeyArn.test(wrappingKeyArn)) {
    throw new TypeError(
      "Invalid configuration - ARN for main envelope encryption wrapping key is invalid."
    );
  }
  return [wrappingKeyArn];
}

const buildKmsKeyring = async (): Promise<KmsKeyringNode> => {
  const { GENERATOR_KEY_ARN, WRAPPING_KEY_ARN } = process.env;
  if (!kmsKeyRingConfig || Object.keys(kmsKeyRingConfig).length === 0) {
    kmsKeyRingConfig = {
      keyIds: formWrappingKeysArray(WRAPPING_KEY_ARN),
    };
  }
  if (GENERATOR_KEY_ARN) {
    if (!RegexpKMSKeyArn.test(GENERATOR_KEY_ARN)) {
      throw new TypeError(
        "Invalid configuration - ARN for envelope encryption Generator key is invalid."
      );
    }
    kmsKeyRingConfig.generatorKeyId = GENERATOR_KEY_ARN;
    return new KmsKeyringNode(kmsKeyRingConfig);
  }
  throw new TypeError(
    "Invalid configuration - ARN for envelope encryption Generator key is undefined"
  );
};

export default buildKmsKeyring;
