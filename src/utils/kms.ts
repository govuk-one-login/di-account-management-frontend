import {
  KMSClient,
  MessageType,
  SignCommand,
  SignCommandOutput,
  SigningAlgorithmSpec,
} from "@aws-sdk/client-kms";
import { KmsService } from "./types";
import { getKMSConfig, KmsConfig } from "../config/aws";

const config: KmsConfig = getKMSConfig();
const client = new KMSClient(config.awsConfig as any);
export const signingAlgorithm = SigningAlgorithmSpec.RSASSA_PKCS1_V1_5_SHA_512;
export const kmsService: KmsService = {
  sign: async (payload: string): Promise<SignCommandOutput> => {
    const params = {
      KeyId: config.kmsKeyId,
      Message: Buffer.from(payload),
      MessageType: MessageType.RAW,
      SigningAlgorithm: signingAlgorithm,
    };
    const request: SignCommand = new SignCommand(params);
    return await client.send(request);
  },
};
