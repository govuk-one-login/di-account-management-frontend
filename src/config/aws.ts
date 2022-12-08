import AWS from "aws-sdk";
import type { Endpoint } from "aws-sdk";
import {
  getAppEnv,
  getAwsRegion,
  getKmsKeyId,
  getLocalStackBaseUrl,
} from "../config";

//refer to seed.yaml
const LOCAL_KEY_ID = "ff275b92-0def-4dfc-b0f6-87c96b26c6c7";

export interface AWSCredentials {
  AWS_ACCESS_KEY_ID: string;
  AWS_REGION: string;
  AWS_SECRET_ACCESS_KEY: string;
  KMS_KEY_ALIAS: string;
  KMS_KEY_ID: string;
}

export interface KmsConfig {
  awsConfig: AwsConfig;
  kmsKeyId: string;
}

export interface AwsConfig {
  endpoint?: Endpoint,
  accessKeyId?: string,
  secretAccessKey?: string,
  region: string
}

function getLocalStackKmsConfig() {
  return {
    awsConfig: { ...getLocalStackAWSConfig() },
    kmsKeyId: LOCAL_KEY_ID,
  };
}

function getLocalStackAWSConfig(): AwsConfig {
  return {
    endpoint: new AWS.Endpoint(getLocalStackBaseUrl()),
    accessKeyId: "na",
    secretAccessKey: "na",
    region: "eu-west-2",
  }
}

export function getKMSConfig(): KmsConfig {
  if (getAppEnv() === "local") {
    return getLocalStackKmsConfig();
  }

  return {
    awsConfig: {
      region: getAwsRegion(),
    },
    kmsKeyId: getKmsKeyId(),
  };
}
