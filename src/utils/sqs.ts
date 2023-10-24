import { SqsService } from "./types";
import {
  SendMessageCommand, SendMessageCommandOutput,
  SendMessageRequest,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { logger } from "./logger";

export function sqsService(): SqsService {
  const send = async function (messageBody: string): Promise<any> {
    const { AWS_REGION } = process.env;
    const { AUDIT_QUEUE_URL } = process.env;
    const client = new SQSClient({ region: AWS_REGION });
    const message: SendMessageRequest = {
      QueueUrl: AUDIT_QUEUE_URL,
      MessageBody: messageBody,
    };

    if (AUDIT_QUEUE_URL != null) {
      try {
        const result: SendMessageCommandOutput = await client.send(new SendMessageCommand(message));
        logger.info(`Event sent with message id ${result.MessageId}`);
      } catch (err) {
        logger.error(`Failed to send message ${message.MessageBody} to SQS: ${err}`)
      }
    } else {
      logger.error(`Environment missing value for AUDIT_QUEUE_URL, cannot send ${message.MessageBody}.`);
    }
  };

  return { send };
}
