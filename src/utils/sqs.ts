import { SqsService } from "./types";
import {
  SendMessageCommand, SendMessageCommandOutput,
  SendMessageRequest,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { logger } from "./logger";

export function sqsService(): SqsService {
  const send = async function (
    messageBody: string
  ): Promise<any> {
    const { AWS_REGION } = process.env;
    const { AUDIT_QUEUE_URL, DLQ_URL } = process.env;
    const client = new SQSClient({ region: AWS_REGION });
    const message: SendMessageRequest = {
      QueueUrl: AUDIT_QUEUE_URL,
      MessageBody: messageBody,
    };
    try {
      const result: SendMessageCommandOutput = await client.send(new SendMessageCommand(message));
      logger.info(`Event sent with message id ${result.MessageId}`);
    } catch(err) {
      const dlqMessage: SendMessageRequest = {
        QueueUrl: DLQ_URL,
        MessageBody: messageBody,
      };
      const dlqResult: SendMessageCommandOutput = await client.send(new SendMessageCommand(dlqMessage));
      logger.info(`Event sent to DLQ with message id ${dlqResult.MessageId}`);
    }
  };

  return { send };
}
