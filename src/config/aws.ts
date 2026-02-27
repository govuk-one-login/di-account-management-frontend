import { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import {
  isLocalEnv,
  getAwsRegion,
  getKmsKeyId,
  getLocalStackBaseUrl,
} from "../config.js";
import { SQSClient, SQSClientConfig } from "@aws-sdk/client-sqs";
import { readEnvVar } from "../utils/read-envs.js";

//refer to seed.yaml
function getLocalKeyId() {
  return readEnvVar("LOCAL_KEY_ID");
}

export interface KmsConfig {
  awsConfig: AwsConfig;
  kmsKeyId: string;
}

export interface SnsConfig {
  awsConfig: AwsConfig;
}

export interface Credentials {
  accessKeyId?: string;
  secretAccessKey?: string;
}

export interface AwsConfig {
  endpoint?: string;
  credentials?: Credentials;
  region: string;
}

function getLocalStackKmsConfig() {
  return {
    awsConfig: { ...getLocalStackAWSConfig() },
    kmsKeyId: getLocalKeyId(),
  };
}

function getLocalStackAWSConfig(): AwsConfig {
  return {
    endpoint: getLocalStackBaseUrl(),
    credentials: {
      accessKeyId: "na",
      secretAccessKey: "na", //pragma: allowlist secret
    },
    region: getAwsRegion(),
  };
}

export function getSNSConfig(): SnsConfig {
  if (isLocalEnv()) {
    return {
      awsConfig: { ...getLocalStackAWSConfig() },
    };
  }

  return {
    awsConfig: {
      region: getAwsRegion(),
    },
  };
}

/* SQS */
export interface SqsConfig {
  awsConfig: AwsConfig;
  sqsClientConfig: SQSClientConfig;
}

export function getSQSConfig(): SqsConfig {
  if (isLocalEnv()) {
    return {
      awsConfig: { ...getLocalStackAWSConfig() },
      sqsClientConfig: {
        region: getAwsRegion(),
        endpoint: "http://localstack:4566", // NOSONAR: http used locally
        credentials: {
          accessKeyId: "na",
          secretAccessKey: "na", //pragma: allowlist secret
        },
      },
    };
  }

  return {
    awsConfig: {
      region: getAwsRegion(),
    },
    sqsClientConfig: {
      region: getAwsRegion(),
    },
  };
}

// Singleton

export const sqsClient = (() => {
  let instance: SQSClient;
  return {
    getClient: () => {
      if (!instance) {
        instance = new SQSClient(getSQSConfig());
      }
      return instance;
    },
  };
})();

export function getAWSConfig(): AwsConfig {
  if (isLocalEnv()) {
    return getLocalStackAWSConfig();
  }

  return {
    region: getAwsRegion(),
  };
}

export function getKMSConfig(): KmsConfig {
  if (isLocalEnv()) {
    return getLocalStackKmsConfig();
  }

  return {
    awsConfig: {
      region: getAwsRegion(),
    },
    kmsKeyId: getKmsKeyId(),
  };
}

export function getDBConfig(
  config: AwsConfig = getAWSConfig()
): DynamoDBClientConfig {
  const dbConfig: any = {};

  if (config.credentials?.accessKeyId || config.credentials?.secretAccessKey) {
    dbConfig.credentials = {
      accessKeyId: config.credentials.accessKeyId || "",
      secretAccessKey: config.credentials.secretAccessKey || "", //pragma: allowlist secret
    };
  }

  if (config.endpoint) {
    dbConfig.endpoint = config.endpoint;
  }

  if (config.region) {
    dbConfig.region = config.region;
  }

  return dbConfig;
}
