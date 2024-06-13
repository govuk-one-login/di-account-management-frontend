import { SNS } from "aws-sdk";
import { SnsService } from "./types.js";
import { getSNSConfig, SnsConfig } from "../config/aws.js";

export function snsService(config: SnsConfig = getSNSConfig()): SnsService {
  const publish = async function (
    topic_arn: string,
    message: string
  ): Promise<SNS.Types.PublishResponse> {
    const sns = new SNS(config.awsConfig);

    const request: SNS.PublishInput = {
      TopicArn: topic_arn,
      Message: message,
    };

    return await sns.publish(request).promise();
  };
  return {
    publish,
  };
}
