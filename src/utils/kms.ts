import {
  KMSClient,
  MessageType,
  SignCommand,
  SignCommandOutput,
  SigningAlgorithmSpec,
} from "@aws-sdk/client-kms";
import { KmsService } from "./types";
import { getKMSConfig, KmsConfig } from "../config/aws";

export function kmsService(config: KmsConfig = getKMSConfig()): KmsService {
  const sign = async function (payload: string): Promise<SignCommandOutput> {
    const client = new KMSClient(config.awsConfig as any);

    const params = {
      KeyId: config.kmsKeyId,
      Message: Buffer.from(payload),
      MessageType: MessageType.RAW,
      SigningAlgorithm: SigningAlgorithmSpec.RSASSA_PKCS1_V1_5_SHA_512,
    };
    const request: SignCommand = new SignCommand(params);
    return await client.send(request);
  };

  return {
    sign,
  };
}
