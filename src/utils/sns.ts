import {
  PublishCommand,
  PublishCommandOutput,
  SNSClient,
} from "@aws-sdk/client-sns";
import { SnsService } from "./types.js";
import { getSNSConfig, SnsConfig } from "../config/aws.js";

const config: SnsConfig = getSNSConfig();
const client = new SNSClient(config.awsConfig as any);

export function snsService(): SnsService {
  const publish = async function (
    topic_arn: string,
    message: string
  ): Promise<PublishCommandOutput> {
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
