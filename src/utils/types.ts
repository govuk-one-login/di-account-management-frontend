import { KMS } from "aws-sdk";

export interface KmsService {
  sign: (payload: string) => Promise<KMS.Types.SignResponse>;
}

export interface AwsConfig {
  AWS_ACCESS_KEY_ID: string;
  AWS_REGION: string;
  AWS_SECRET_ACCESS_KEY: string;
  KMS_KEY_ALIAS: string;
  KMS_KEY_ID: string;
}
