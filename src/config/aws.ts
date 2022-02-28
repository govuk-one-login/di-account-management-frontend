import AWS from "aws-sdk";
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
  awsConfig: any;
  kmsKeyId: string;
}

function getLocalStackConfig() {
  return {
    awsConfig: {
      endpoint: new AWS.Endpoint(getLocalStackBaseUrl()),
      accessKeyId: "na",
      secretAccessKey: "na",
      region: "eu-west-2",
    },
    kmsKeyId: LOCAL_KEY_ID,
  };
}

export function getKMSConfig(): KmsConfig {
  if (getAppEnv() === "local") {
    return getLocalStackConfig();
  }

  return {
    awsConfig: {
      region: getAwsRegion(),
    },
    kmsKeyId: getKmsKeyId(),
  };
}
