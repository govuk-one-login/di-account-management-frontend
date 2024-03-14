import { Endpoint } from "aws-sdk";
import { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import {
  isLocalEnv,
  getAwsRegion,
  getKmsKeyId,
  getLocalStackBaseUrl,
} from "../config";
import { SQSClient, SQSClientConfig } from "@aws-sdk/client-sqs";
import { readEnvVar } from "../utils/read-envs";

//refer to seed.yaml
const LOCAL_KEY_ID = readEnvVar("LOCAL_KEY_ID");

export interface KmsConfig {
  awsConfig: AwsConfig;
  kmsKeyId: string;
}

export interface SnsConfig {
  awsConfig: AwsConfig;
}

export interface AwsConfig {
  endpoint?: Endpoint;
  accessKeyId?: string;
  secretAccessKey?: string;
  region: string;
}

function getLocalStackKmsConfig() {
  return {
    awsConfig: { ...getLocalStackAWSConfig() },
    kmsKeyId: LOCAL_KEY_ID,
  };
}

function getLocalStackAWSConfig(): AwsConfig {
  return {
    endpoint: new Endpoint(getLocalStackBaseUrl()),
    accessKeyId: "na",
    secretAccessKey: "na",
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
          secretAccessKey: "na",
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

  if (config.accessKeyId || config.secretAccessKey) {
    dbConfig.credentials = {
      accessKeyId: config.accessKeyId || "",
      secretAccessKey: config.secretAccessKey || "",
    };
  }

  if (config.endpoint) {
    dbConfig.endpoint = `${config.endpoint.protocol}//${config.endpoint.host}`;
  }

  if (config.region) {
    dbConfig.region = config.region;
  }

  return dbConfig;
}
