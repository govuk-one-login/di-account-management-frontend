import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SqsService } from "../types";
import { AuditEvent } from "../../services/types";
import { sqsService } from "../sqs";
import { SQSClient, SendMessageCommandOutput } from "@aws-sdk/client-sqs";
import { logger } from "../logger.js";
import * as redact from "../redact.js";
import { EventName, ERROR_MESSAGES, LOG_MESSAGES } from "../../app.constants";

const messageId = "message-id";

describe("SQS service tests", (): void => {
  let sqsClientStub: ReturnType<typeof vi.spyOn>;
  let loggerSpy: ReturnType<typeof vi.spyOn>;
  let errorLoggerSpy: ReturnType<typeof vi.spyOn>;
  const expectedEvent: AuditEvent = {
    timestamp: undefined,
    event_timestamp_ms: 1,
    event_timestamp_ms_formatted: "1",
    event_name: EventName.HOME_TRIAGE_PAGE_VISIT,
    component_id: "HOME",
    user: {
      session_id: "session-id",
      persistent_session_id: "persistent-session-id",
      user_id: "user-id",
    },
    platform: undefined,
    extensions: undefined,
  };
  const redactedExpectedEvent: AuditEvent = {
    timestamp: undefined,
    event_timestamp_ms: 1,
    event_timestamp_ms_formatted: "1",
    event_name: EventName.HOME_TRIAGE_PAGE_VISIT,
    component_id: "HOME",
    user: {
      session_id: "session-id",
      persistent_session_id: "persistent-session-id",
      user_id: "REDACTED",
    },
    platform: undefined,
    extensions: undefined,
  };

  beforeEach((): void => {
    sqsClientStub = vi.spyOn(SQSClient.prototype, "send");
    loggerSpy = vi.spyOn(logger, "info");
    errorLoggerSpy = vi.spyOn(logger, "error");
    process.env.AUDIT_QUEUE_URL = "queue";
    process.env.AUDIT_QUEUE_DLQ_URL = "dlq";
  });

  afterEach((): void => {
    vi.restoreAllMocks();
  });

  it("can send a message to the audit event queue", async (): Promise<void> => {
    const sqsResponse: SendMessageCommandOutput = {
      $metadata: undefined,
      MessageId: messageId,
      MD5OfMessageBody: "md5-hash",
    };
    sqsClientStub.mockResolvedValue(sqsResponse);
    const sqs: SqsService = sqsService();

    await sqs.sendAuditEvent(JSON.stringify(expectedEvent), "trace-id");

    expect(sqsClientStub).toHaveBeenCalledOnce();
    expect(loggerSpy).toHaveBeenCalledOnce();
    expect(loggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      LOG_MESSAGES.EVENT_SENT_SUCCESSFULLY(
        process.env.AUDIT_QUEUE_URL,
        messageId
      )
    );
    expect(errorLoggerSpy).not.toHaveBeenCalled();
  });

  it("can send a message to another queue", async (): Promise<void> => {
    const sqsResponse: SendMessageCommandOutput = {
      $metadata: undefined,
      MessageId: messageId,
      MD5OfMessageBody: "md5-hash",
    };
    sqsClientStub.mockResolvedValue(sqsResponse);
    const sqs: SqsService = sqsService();

    await sqs.sendMessage(
      "https://fake.queue.com",
      JSON.stringify(expectedEvent),
      "trace-id"
    );

    expect(sqsClientStub).toHaveBeenCalledOnce();
    expect(loggerSpy).toHaveBeenCalledOnce();
    expect(loggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      LOG_MESSAGES.EVENT_SENT_SUCCESSFULLY("https://fake.queue.com", messageId)
    );
    expect(errorLoggerSpy).not.toHaveBeenCalled();
  });

  it("sends audit event to DLQ when error sending to TxMA", async (): Promise<void> => {
    const expectedError: Error = new Error("simulated error");
    const dlqSqsResponse: SendMessageCommandOutput = {
      $metadata: undefined,
      MessageId: messageId,
      MD5OfMessageBody: "md5-hash",
    };
    sqsClientStub.mockRejectedValueOnce(expectedError);
    sqsClientStub.mockResolvedValueOnce(dlqSqsResponse);
    const sqs: SqsService = sqsService();

    await sqs.sendAuditEvent(JSON.stringify(expectedEvent), "trace-id");

    expect(sqsClientStub).toHaveBeenCalledTimes(2);
    expect(errorLoggerSpy).toHaveBeenCalledTimes(2);
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.FAILED_TO_SEND_TO_TXMA
    );
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      expectedError.toString()
    );
    expect(loggerSpy).toHaveBeenCalledOnce();
    expect(loggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      LOG_MESSAGES.EVENT_SENT_SUCCESSFULLY(
        process.env.AUDIT_QUEUE_DLQ_URL,
        messageId
      )
    );
  });

  it("logs redacted event when fails to send to DLQ", async (): Promise<void> => {
    const expectedError: Error = new Error("simulated error");
    sqsClientStub.mockRejectedValueOnce(expectedError);
    sqsClientStub.mockRejectedValueOnce(expectedError);
    const sqs: SqsService = sqsService();
    const expectedEventAsJSONString = JSON.stringify(expectedEvent);
    const redactedExpectedEventAsJSONString = JSON.stringify(
      redactedExpectedEvent
    );

    await sqs.sendAuditEvent(expectedEventAsJSONString, "trace-id");

    expect(sqsClientStub).toHaveBeenCalledTimes(2);
    expect(errorLoggerSpy).toHaveBeenCalledTimes(5);
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      expectedError.toString()
    );
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.FAILED_TO_SEND_TO_TXMA
    );
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      expectedError.toString()
    );
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.FAILED_SEND_TO_TXMA_DLQ
    );
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.REDACTED_EVENT(redactedExpectedEventAsJSONString)
    );
    expect(loggerSpy).not.toHaveBeenCalled();
  });

  it("sends to dlq when audit queue url is not defined", async (): Promise<void> => {
    const sqs: SqsService = sqsService();
    const expectedEventAsJSONString = JSON.stringify(expectedEvent);
    delete process.env.AUDIT_QUEUE_URL;
    const sqsResponse: SendMessageCommandOutput = {
      $metadata: undefined,
      MessageId: messageId,
      MD5OfMessageBody: "md5-hash",
    };
    sqsClientStub.mockResolvedValue(sqsResponse);

    await sqs.sendAuditEvent(expectedEventAsJSONString, "trace-id");

    expect(sqsClientStub).toHaveBeenCalledOnce();
    expect(errorLoggerSpy).toHaveBeenCalledTimes(2);
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.QUEUE_URL_MISSING
    );
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.FAILED_TO_SEND_TO_TXMA
    );
    expect(loggerSpy).toHaveBeenCalledOnce();
    expect(loggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      LOG_MESSAGES.EVENT_SENT_SUCCESSFULLY(
        process.env.AUDIT_QUEUE_DLQ_URL,
        messageId
      )
    );
  });

  it("does not send when audit queue dlq url is not defined", async (): Promise<void> => {
    const sqs: SqsService = sqsService();
    const expectedEventAsJSONString = JSON.stringify(expectedEvent);
    delete process.env.AUDIT_QUEUE_DLQ_URL;
    const expectedError: Error = new Error("simulated error");
    sqsClientStub.mockRejectedValueOnce(expectedError);
    const redactedExpectedEventAsJSONString = JSON.stringify(
      redactedExpectedEvent
    );

    await sqs.sendAuditEvent(expectedEventAsJSONString, "trace-id");

    expect(sqsClientStub).toHaveBeenCalledOnce();
    expect(loggerSpy).not.toHaveBeenCalled();
    expect(errorLoggerSpy).toHaveBeenCalledTimes(5);
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      expectedError.toString()
    );
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.FAILED_TO_SEND_TO_TXMA
    );
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.QUEUE_URL_MISSING
    );
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.FAILED_SEND_TO_TXMA_DLQ
    );
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.REDACTED_EVENT(redactedExpectedEventAsJSONString)
    );
  });

  it("does not log the audit event when redaction fails", async (): Promise<void> => {
    const redactError: Error = new Error("a json error");
    const redactStub = vi.spyOn(redact, "redact");
    redactStub.mockImplementation(() => {
      throw redactError;
    });
    const expectedError: Error = new Error("simulated error");
    sqsClientStub.mockRejectedValueOnce(expectedError);
    sqsClientStub.mockRejectedValueOnce(expectedError);
    const sqs: SqsService = sqsService();
    const expectedEventAsJSONString = JSON.stringify(expectedEvent);

    await sqs.sendAuditEvent(expectedEventAsJSONString, "trace-id");

    expect(errorLoggerSpy).toHaveBeenCalledTimes(5);
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      expectedError.toString()
    );
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.FAILED_TO_SEND_TO_TXMA
    );
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      expectedError.toString()
    );
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.FAILED_SEND_TO_TXMA_DLQ
    );
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.MESSAGE_COULD_NOT_BE_REDACTED(redactError as any)
    );
    expect(loggerSpy).not.toHaveBeenCalled();
  });
});
