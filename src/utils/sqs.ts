import { SqsService } from "./types";
import {
  SendMessageCommand,
  SendMessageCommandOutput,
  SendMessageRequest,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { logger } from "./logger";
import { ENVIRONMENT_NAME } from "../app.constants";

// Initialize the SQSClient only once
const { AWS_REGION } = process.env;
const { AUDIT_QUEUE_URL } = process.env;
const isDevelopment = process.env.NODE_ENV === ENVIRONMENT_NAME.DEV;
const client = new SQSClient({
  region: AWS_REGION,
  endpoint: isDevelopment ? AUDIT_QUEUE_URL : undefined,
});

export function sqsService(): SqsService {
  const send = async function (messageBody: string): Promise<any> {
    const message: SendMessageRequest = {
      QueueUrl: AUDIT_QUEUE_URL,
      MessageBody: messageBody,
    };

    if (!AUDIT_QUEUE_URL) {
      logger.error(
        `Environment missing value for AUDIT_QUEUE_URL, cannot send ${message.MessageBody}.`
      );
      return;
    }

    try {
      const result: SendMessageCommandOutput = await client.send(
        new SendMessageCommand(message)
      );
      logger.info(`Event sent with message id ${result.MessageId}`);
    } catch (err) {
      logger.error(
        `Failed to send message ${message.MessageBody} to SQS: ${err}`
      );
    }
  };

  return { send };
}
