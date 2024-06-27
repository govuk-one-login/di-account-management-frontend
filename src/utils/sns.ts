import {
  PublishCommand,
  PublishCommandOutput,
  SNSClient,
} from "@aws-sdk/client-sns";
import { SnsService } from "./types";
import { getSNSConfig, SnsConfig } from "../config/aws";

export function snsService(config: SnsConfig = getSNSConfig()): SnsService {
  const publish = async function (
    topic_arn: string,
    message: string
  ): Promise<PublishCommandOutput> {
    const client = new SNSClient(config.awsConfig as any);

    const params = {
      TopicArn: topic_arn,
      Message: message,
    };
    const request: PublishCommand = new PublishCommand(params);
    return await client.send(request);
  };
  return {
    publish,
  };
}
