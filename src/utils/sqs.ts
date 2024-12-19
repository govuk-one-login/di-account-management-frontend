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

const AUDIT_QUEUE_URL = process.env.AUDIT_QUEUE_URL;
const AUDIT_QUEUE_DLQ_URL = process.env.AUDIT_QUEUE_DLQ_URL;

function buildMessage(
  queueUrl: string,
  messageBody: string,
  trace: string
): SendMessageRequest | null {
  if (!queueUrl) {
    logger.error({ trace }, QUEUE_URL_MISSING);
    return null;
  }
  return {
    QueueUrl: queueUrl,
    MessageBody: messageBody,
  };
}

function logRedacted(jsonAsString: string, trace: string): void {
  try {
    const failedEvent: string = redact(
      jsonAsString,
      FIELDS_REDACTED_FROM_LOG_MESSAGES
    );
    logger.error({ trace }, REDACTED_EVENT(failedEvent));
  } catch (err) {
    logger.error({ trace }, MESSAGE_COULD_NOT_BE_REDACTED(err));
  }
}

async function sendToQueue(
  queueUrl: string,
  messageBody: string,
  trace: string
): Promise<boolean> {
  const request = buildMessage(queueUrl, messageBody, trace);
  if (!request) {
    return false;
  }

  try {
    const result: SendMessageCommandOutput = await sqsClient
      .getClient()
      .send(new SendMessageCommand(request));
    logger.info({ trace }, EVENT_SENT_SUCCESSFULLY(queueUrl, result.MessageId));
    return true;
  } catch (err: any) {
    logger.error({ trace }, err.toString());
    return false;
  }
}

function sqsService(): SqsService {
  const send = async function (
    messageBody: string,
    trace: string
  ): Promise<any> {
    if (await sendToQueue(AUDIT_QUEUE_URL, messageBody, trace)) {
      return;
    }

    logger.error({ trace }, FAILED_TO_SEND_TO_TXMA);

    if (await sendToQueue(AUDIT_QUEUE_DLQ_URL, messageBody, trace)) {
      return;
    }

    logger.error({ trace }, FAILED_SEND_TO_TXMA_DLQ);
    logRedacted(messageBody, trace);
  };

  return { send };
}

export { sqsService };
