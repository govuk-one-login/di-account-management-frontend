import { SqsService } from "./types";
import {
  SendMessageCommand,
  SendMessageCommandOutput,
  SendMessageRequest,
} from "@aws-sdk/client-sqs";
import { logger } from "./logger";
import { sqsClient } from "../config/aws";

export function sqsService(): SqsService {
  const send = async function (
    messageBody: string,
    trace: string
  ): Promise<any> {
    const { AUDIT_QUEUE_URL } = process.env;

    if (AUDIT_QUEUE_URL == null) {
      logger.error(
        { trace: trace },
        `Environment missing value for AUDIT_QUEUE_URL, cannot send ${messageBody}.`
      );
      return;
    }

    const message: SendMessageRequest = {
      QueueUrl: AUDIT_QUEUE_URL,
      MessageBody: messageBody,
    };

    try {
      const result: SendMessageCommandOutput = await sqsClient
        .getClient()
        .send(new SendMessageCommand(message));
      logger.info(
        { trace: trace },
        `Event sent with message id ${result.MessageId}`
      );
    } catch (err) {
      logger.error(
        { trace: trace },
        `Failed to send message ${message.MessageBody} to SQS: ${err}`
      );
    }
  };

  return { send };
}
