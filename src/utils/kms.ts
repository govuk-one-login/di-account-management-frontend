import * as aws from "aws-sdk";
import { KmsService } from "./types.js";
import { getKMSConfig, KmsConfig } from "../config/aws.js";

export function kmsService(config: KmsConfig = getKMSConfig()): KmsService {
  const sign = async function (
    payload: string
  ): Promise<aws.KMS.Types.SignResponse> {
    const kms = new aws.KMS(config.awsConfig);

    const request: aws.KMS.SignRequest = {
      KeyId: config.kmsKeyId,
      Message: payload,
      SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_512",
      MessageType: "RAW",
    };

    return await kms.sign(request).promise();
  };

  return {
    sign,
  };
}
