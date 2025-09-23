import { SqsService } from "./types";
import {
  SendMessageCommand,
  SendMessageCommandOutput,
  SendMessageRequest,
} from "@aws-sdk/client-sqs";
import { logger } from "./logger";
import { sqsClient } from "../config/aws";
import { redact } from "./redact";
import { ERROR_MESSAGES, LOG_MESSAGES } from "../app.constants";

const { EVENT_SENT_SUCCESSFULLY } = LOG_MESSAGES;

const {
  QUEUE_URL_MISSING,
  REDACTED_EVENT,
  MESSAGE_COULD_NOT_BE_REDACTED,
  FAILED_TO_SEND_TO_TXMA,
  FAILED_SEND_TO_TXMA_DLQ,
} = ERROR_MESSAGES;

const FIELDS_REDACTED_FROM_LOG_MESSAGES: string[] = ["user_id"];

function buildMessage(
  queue: string,
  messageBody: string,
  trace: string
): SendMessageRequest {
  if (queue === null || queue === undefined) {
    logger.error({ trace: trace }, QUEUE_URL_MISSING);
    return;
  }

  return {
    QueueUrl: queue,
    MessageBody: messageBody,
  };
}

function logRedacted(
  jsonAsString: string,
  propertyNames: string[],
  trace: string
): void {
  try {
    const failedEvent: string = redact(jsonAsString, propertyNames);
    logger.error({ trace: trace }, REDACTED_EVENT(failedEvent));
  } catch (error) {
    logger.error({ trace: trace }, MESSAGE_COULD_NOT_BE_REDACTED(error));
  }
}

async function sendToQueue(
  queue: string,
  messageBody: string,
  trace: string
): Promise<boolean> {
  const request: SendMessageRequest = buildMessage(queue, messageBody, trace);

  if (request === null || request === undefined) {
    return false;
  }

  try {
    const result: SendMessageCommandOutput = await sqsClient
      .getClient()
      .send(new SendMessageCommand(request));
    logger.info(
      { trace: trace },
      EVENT_SENT_SUCCESSFULLY(queue, result.MessageId)
    );
    return true;
  } catch (error: any) {
    logger.error({ trace: trace }, error.toString());
  }

  return false;
}

const sendAuditEvent = async function (
  messageBody: string,
  trace: string
): Promise<any> {
  const { AUDIT_QUEUE_URL } = process.env;
  const messageSent = await sendToQueue(AUDIT_QUEUE_URL, messageBody, trace);

  if (!messageSent) {
    logger.error({ trace: trace }, FAILED_TO_SEND_TO_TXMA);
    const { AUDIT_QUEUE_DLQ_URL } = process.env;
    const messageSentToDLQ = await sendToQueue(
      AUDIT_QUEUE_DLQ_URL,
      messageBody,
      trace
    );
    if (!messageSentToDLQ) {
      logger.error({ trace: trace }, FAILED_SEND_TO_TXMA_DLQ);
      logRedacted(messageBody, FIELDS_REDACTED_FROM_LOG_MESSAGES, trace);
    }
  }
};

const sendMessage = async function (
  queueUrl: string,
  messageBody: string,
  trace: string
) {
  await sendToQueue(queueUrl, messageBody, trace);
};

function sqsService(): SqsService {
  return { sendAuditEvent, sendMessage };
}

export { sqsService };
