import { describe } from "mocha";
import { SqsService } from "../../src/utils/types";
import { AuditEvent } from "../../src/services/types";
import { sqsService } from "../../src/utils/sqs";
import { SQSClient, SendMessageCommandOutput } from "@aws-sdk/client-sqs";
import { SinonStub, stub } from "sinon";
import { sinon } from "./test-utils";
import { logger } from "../../src/utils/logger";
import { expect } from "chai";

describe("SQS service tests", (): void => {
  let sqsClientStub: SinonStub;
  let loggerSpy: sinon.SinonSpy;
  let errorLoggerSpy: sinon.SinonSpy;
  const expectedEvent: AuditEvent = {
    timestamp: undefined,
    event_name: "HOME_TRIAGE_PAGE_VISIT",
    component_id: "HOME",
    user: undefined,
    platform: undefined,
    extensions: undefined,
  };

  beforeEach((): void => {
    sqsClientStub = stub(SQSClient.prototype, "send");
    loggerSpy = sinon.spy(logger, "info");
    errorLoggerSpy = sinon.spy(logger, "error");
    process.env.AUDIT_QUEUE_URL = "queue";
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
      MessageId: "message-id",
      MD5OfMessageBody: "md5-hash",
    };
    sqsClientStub.returns(sqsResponse);
    const sqs: SqsService = sqsService();

    // Act
    await sqs.send(JSON.stringify(expectedEvent));

    // Assert
    expect(sqsClientStub).to.have.calledOnce;
    expect(loggerSpy).to.have.calledWith(
      "Event sent with message id message-id"
    );
  });

  it("logs event when error sending to SQS", async (): Promise<void> => {
    // Arrange
    const expectedError: Error = new Error("simulated error");
    sqsClientStub.throws(expectedError);
    const sqs: SqsService = sqsService();

    // Act
    await sqs.send(JSON.stringify(expectedEvent));

    // Assert
    expect(errorLoggerSpy).to.have.calledWith(
      `Failed to send message ${JSON.stringify(
        expectedEvent
      )} to SQS: ${expectedError}`
    );
  });

  it("logs at error level if environment not set correctly", async (): Promise<void> => {
    // Arrange
    const sqs: SqsService = sqsService();
    const expectedMessage: string = JSON.stringify(expectedEvent);
    delete process.env.AUDIT_QUEUE_URL;

    // Act
    await sqs.send(expectedMessage);

    // Assert
    expect(errorLoggerSpy).to.have.calledWith(
      `Environment missing value for AUDIT_QUEUE_URL, cannot send ${expectedMessage}.`
    );
  });
});
