import {
  DescribeKeyCommand,
  GetPublicKeyCommand,
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
  getPublicKey: async (params: { KeyId: string }) => {
    return await client.send(new GetPublicKeyCommand(params));
  },
  describeKey: async (params: { KeyId: string }) => {
    return await client.send(new DescribeKeyCommand(params));
  },
};
