import { KMS } from "aws-sdk";
import { KmsService } from "./types";
import { getKMSConfig, KmsConfig } from "../config/aws";

export function kmsService(config: KmsConfig = getKMSConfig()): KmsService {
  const sign = async function (
    payload: string
  ): Promise<KMS.Types.SignResponse> {
    const kms = new KMS(config.awsConfig);

    const request: KMS.SignRequest = {
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
