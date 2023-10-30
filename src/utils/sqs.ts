import { SqsService } from "./types";
import {
  SendMessageCommand, SendMessageCommandOutput,
  SendMessageRequest,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { logger } from "./logger";
import { getSQSConfig, SqsConfig } from "../config/aws";

export function sqsService(config: SqsConfig = getSQSConfig()): SqsService {
  const send = async function (messageBody: string): Promise<any> {
    const { AUDIT_QUEUE_URL } = process.env;

    if (AUDIT_QUEUE_URL == null) {
      logger.error(`Environment missing value for AUDIT_QUEUE_URL, cannot send ${messageBody}.`);
      return;
    }

    const client = new SQSClient(config.sqsClientConfig);

    const message: SendMessageRequest = {
      QueueUrl: AUDIT_QUEUE_URL,
      MessageBody: messageBody,
    };

    try {
      const result: SendMessageCommandOutput = await client.send(new SendMessageCommand(message));
      logger.info(`Event sent with message id ${result.MessageId}`);
    } catch (err) {
      logger.error(`Failed to send message ${message.MessageBody} to SQS: ${err}`)
    }
  };

  return { send };
}
