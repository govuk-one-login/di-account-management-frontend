import { describe } from "mocha";
import { SqsService } from "../types";
import { AuditEvent } from "../../services/types";
import { sqsService } from "../sqs";
import { SQSClient, SendMessageCommandOutput } from "@aws-sdk/client-sqs";
import sinon, { SinonStub, stub } from "sinon";
import chai from "chai";
import sinonChai from "sinon-chai";
import { logger } from "../logger";
import * as redact from "../redact";
import chaiAsPromised from "chai-as-promised";
import { EventName, ERROR_MESSAGES, LOG_MESSAGES } from "../../app.constants";

chai.use(sinonChai);
chai.use(chaiAsPromised);
const expect = chai.expect;

const messageId = "message-id";

describe("SQS service tests", (): void => {
  let sqsClientStub: SinonStub;
  let loggerSpy: sinon.SinonSpy;
  let errorLoggerSpy: sinon.SinonSpy;
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
    sqsClientStub = stub(SQSClient.prototype, "send");
    loggerSpy = sinon.spy(logger, "info");
    errorLoggerSpy = sinon.spy(logger, "error");
    process.env.AUDIT_QUEUE_URL = "queue";
    process.env.AUDIT_QUEUE_DLQ_URL = "dlq";
  });

  afterEach((): void => {
    sqsClientStub.restore();
    loggerSpy.restore();
    errorLoggerSpy.restore();
  });

  it("can send a message to an SQS queue", async (): Promise<void> => {
    // Arrange
    const sqsResponse: SendMessageCommandOutput = {
      $metadata: undefined,
      MessageId: messageId,
      MD5OfMessageBody: "md5-hash",
    };
    sqsClientStub.returns(sqsResponse);
    const sqs: SqsService = sqsService();

    // Act
    await sqs.send(JSON.stringify(expectedEvent), "trace-id");

    // Assert
    expect(sqsClientStub).to.have.been.calledOnce;
    expect(loggerSpy).to.have.been.calledOnce;
    expect(loggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      LOG_MESSAGES.EVENT_SENT_SUCCESSFULLY(
        process.env.AUDIT_QUEUE_URL,
        messageId
      )
    );
    expect(errorLoggerSpy).to.not.have.been.called;
  });

  it("sends audit event to DLQ when error sending to TxMA", async (): Promise<void> => {
    // Arrange
    const expectedError: Error = new Error("simulated error");
    const dlqSqsResponse: SendMessageCommandOutput = {
      $metadata: undefined,
      MessageId: messageId,
      MD5OfMessageBody: "md5-hash",
    };
    sqsClientStub.onFirstCall().throws(expectedError);
    sqsClientStub.onSecondCall().returns(dlqSqsResponse);
    const sqs: SqsService = sqsService();

    // Act
    await sqs.send(JSON.stringify(expectedEvent), "trace-id");

    // Assert
    expect(sqsClientStub).to.have.been.calledTwice;
    expect(errorLoggerSpy).to.have.been.calledTwice;
    expect(errorLoggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.FAILED_TO_SEND_TO_TXMA
    );
    expect(errorLoggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      expectedError.toString()
    );
    expect(loggerSpy).to.have.been.calledOnce;
    expect(loggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      LOG_MESSAGES.EVENT_SENT_SUCCESSFULLY(
        process.env.AUDIT_QUEUE_DLQ_URL,
        messageId
      )
    );
  });

  it("logs redacted event when fails to send to DLQ", async (): Promise<void> => {
    // Arrange
    const expectedError: Error = new Error("simulated error");
    sqsClientStub.onFirstCall().throws(expectedError);
    sqsClientStub.onSecondCall().throws(expectedError);
    const sqs: SqsService = sqsService();
    const expectedEventAsJSONString = JSON.stringify(expectedEvent);
    const redactedExpectedEventAsJSONString = JSON.stringify(
      redactedExpectedEvent
    );

    // Act
    await sqs.send(expectedEventAsJSONString, "trace-id");

    // Assert
    expect(sqsClientStub).to.have.been.calledTwice;
    expect(errorLoggerSpy).to.have.callCount(5);
    expect(errorLoggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      expectedError.toString()
    );
    expect(errorLoggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.FAILED_TO_SEND_TO_TXMA
    );
    expect(errorLoggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      expectedError.toString()
    );
    expect(errorLoggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.FAILED_SEND_TO_TXMA_DLQ
    );
    expect(errorLoggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.REDACTED_EVENT(redactedExpectedEventAsJSONString)
    );
    expect(loggerSpy).to.not.have.been.called;
  });

  it("sends to dlq when audit queue url is not defined", async (): Promise<void> => {
    // Arrange
    const sqs: SqsService = sqsService();
    const expectedEventAsJSONString = JSON.stringify(expectedEvent);
    delete process.env.AUDIT_QUEUE_URL;
    const sqsResponse: SendMessageCommandOutput = {
      $metadata: undefined,
      MessageId: messageId,
      MD5OfMessageBody: "md5-hash",
    };
    sqsClientStub.returns(sqsResponse);

    // Act
    await sqs.send(expectedEventAsJSONString, "trace-id");

    // Assert
    expect(sqsClientStub).to.have.been.calledOnce;
    expect(errorLoggerSpy).to.have.callCount(2);
    expect(errorLoggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.QUEUE_URL_MISSING
    );
    expect(errorLoggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.FAILED_TO_SEND_TO_TXMA
    );
    expect(loggerSpy).to.have.been.calledOnce;
    expect(loggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      LOG_MESSAGES.EVENT_SENT_SUCCESSFULLY(
        process.env.AUDIT_QUEUE_DLQ_URL,
        messageId
      )
    );
  });

  it("does not send when audit queue dlq url is not defined", async (): Promise<void> => {
    // Arrange
    const sqs: SqsService = sqsService();
    const expectedEventAsJSONString = JSON.stringify(expectedEvent);
    delete process.env.AUDIT_QUEUE_DLQ_URL;
    const expectedError: Error = new Error("simulated error");
    sqsClientStub.onFirstCall().throws(expectedError);
    const redactedExpectedEventAsJSONString = JSON.stringify(
      redactedExpectedEvent
    );

    // Act
    await sqs.send(expectedEventAsJSONString, "trace-id");

    // Assert
    expect(sqsClientStub).to.have.been.calledOnce;
    expect(loggerSpy).to.not.have.been.called;
    expect(errorLoggerSpy).to.have.callCount(5);
    expect(errorLoggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      expectedError.toString()
    );
    expect(errorLoggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.FAILED_TO_SEND_TO_TXMA
    );
    expect(errorLoggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.QUEUE_URL_MISSING
    );
    expect(errorLoggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.FAILED_SEND_TO_TXMA_DLQ
    );
    expect(errorLoggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.REDACTED_EVENT(redactedExpectedEventAsJSONString)
    );
  });

  it("does not log the audit event when redaction fails", async (): Promise<void> => {
    // Arrange
    const redactError: Error = new Error("a json error");
    const sinonStub: SinonStub = stub(redact, "redact");
    sinonStub.throws(redactError);
    const expectedError: Error = new Error("simulated error");
    sqsClientStub.onFirstCall().throws(expectedError);
    sqsClientStub.onSecondCall().throws(expectedError);
    const sqs: SqsService = sqsService();
    const expectedEventAsJSONString = JSON.stringify(expectedEvent);

    // Act
    await sqs.send(expectedEventAsJSONString, "trace-id");

    // Assert
    expect(errorLoggerSpy).to.have.callCount(5);
    expect(errorLoggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      expectedError.toString()
    );
    expect(errorLoggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.FAILED_TO_SEND_TO_TXMA
    );
    expect(errorLoggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      expectedError.toString()
    );
    expect(errorLoggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.FAILED_SEND_TO_TXMA_DLQ
    );
    expect(errorLoggerSpy).to.have.been.calledWith(
      { trace: "trace-id" },
      ERROR_MESSAGES.MESSAGE_COULD_NOT_BE_REDACTED(redactError as any)
    );
    expect(loggerSpy).to.not.have.been.called;
    sinonStub.restore();
  });
});
