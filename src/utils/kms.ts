import {
  GetPublicKeyCommand,
  KMSClient,
  MessageType,
  SignCommand,
  SignCommandOutput,
  SigningAlgorithmSpec,
} from "@aws-sdk/client-kms";
import { KmsService } from "./types.js";
import { getKMSConfig, KmsConfig } from "../config/aws.js";

const config: KmsConfig = getKMSConfig();
const client = new KMSClient(config.awsConfig as any);
export const kmsService: KmsService = {
  sign: async (payload: string): Promise<SignCommandOutput> => {
    const params = {
      KeyId: config.kmsKeyId,
      Message: Buffer.from(payload),
      MessageType: MessageType.RAW,
      SigningAlgorithm: SigningAlgorithmSpec.RSASSA_PKCS1_V1_5_SHA_512,
    };
    const request: SignCommand = new SignCommand(params);
    return await client.send(request);
  },
  getPublicKey: async () => {
    const command = new GetPublicKeyCommand({ KeyId: config.kmsKeyId });
    return await client.send(command);
  },
};
