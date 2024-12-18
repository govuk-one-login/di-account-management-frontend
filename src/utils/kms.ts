import {
  KMSClient,
  MessageType,
  SignCommand,
  SignCommandOutput,
  SigningAlgorithmSpec,
} from "@aws-sdk/client-kms";
import { KmsService } from "./types";
import { getKMSConfig, KmsConfig } from "../config/aws";
import { cacheWithExpiration } from "./cache";

const clientCacheDuration = 60 * 1000;
const config: KmsConfig = getKMSConfig();

const getKMSClient = async (): Promise<KMSClient> => {
  const cacheKey = `kms-client:${config.kmsKeyId}`;

  return await cacheWithExpiration<KMSClient>(
    cacheKey,
    () => {
      const client = new KMSClient(config.awsConfig as any);
      return Promise.resolve(client);
    },
    clientCacheDuration
  );
};

export function kmsService(): KmsService {
  const sign = async function (payload: string): Promise<SignCommandOutput> {
    const client = await getKMSClient();

    const params = {
      KeyId: config.kmsKeyId,
      Message: Buffer.from(payload),
      MessageType: MessageType.RAW,
      SigningAlgorithm: SigningAlgorithmSpec.RSASSA_PKCS1_V1_5_SHA_512,
    };

    const request: SignCommand = new SignCommand(params);
    return await client.send(request);
  };

  return { sign };
}
