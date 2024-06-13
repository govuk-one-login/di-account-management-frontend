import { describe } from "mocha";
import {
  reportSuspiciousActivityGet,
  reportSuspiciousActivityPost,
} from "../report-suspicious-activity-controller.js";
import { Request, Response } from "express";
import { sinon } from "../../../../test/utils/test-utils.js";
import { expect } from "chai";
import * as dynamo from "../../../utils/dynamo.js";
import * as sns from "../../../utils/sns.js";
import { DynamoDBService } from "../../../utils/types.js";
import { DynamoDB } from "aws-sdk";
import { logger } from "../../../utils/logger.js";
import { AwsConfig } from "../../../config/aws.js";

describe("report suspicious activity controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: any;
  let dynamodbQueryOutput: DynamoDB.Types.QueryOutput;
  let loggerSpy: sinon.SinonSpy;
  let errorLoggerSpy: sinon.SinonSpy;
  let mockDynamoDBService: DynamoDBService;
  let dynamoDBServiceStub: sinon.SinonStub<
    [awsConfig?: AwsConfig],
    DynamoDBService
  >;
  let snsPublishSpy: sinon.SinonSpy;
  let clock: sinon.SinonFakeTimers;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    loggerSpy = sinon.spy(logger, "info");
    errorLoggerSpy = sinon.spy(logger, "error");
    clock = sinon.useFakeTimers(new Date(101));

    req = {
      query: { event: "event-id", reported: "false" },
      session: {
        user_id: "user-id",
        user: {
          email: "test@email.moc",
        },
      } as any,
      log: logger,
      body: {
        event_id: "event-id",
        page: "",
      },
    };
    res = {
      locals: {
        trace: "trace-id",
        persistentSessionId: "persistent-session-id",
        sessionId: "session-id",
      },
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
    };
    next = sandbox.fake(() => {});
    dynamodbQueryOutput = {
      Items: [
        {
          event_id: { S: "event-id" },
          timestamp: { N: "1680025701" },
          session_id: { S: "session-id" },
          client_id: { S: "vehicleOperatorLicense" },
          event_type: { S: "AUTH_AUTH_CODE_ISSUED" },
          reported_suspicious: { BOOL: false },
        },
      ],
    };
    mockDynamoDBService = {
      getItem(): Promise<DynamoDB.GetItemOutput> {
        return Promise.resolve(undefined);
      },
      queryItem(): Promise<DynamoDB.Types.QueryOutput> {
        return Promise.resolve(dynamodbQueryOutput);
      },
    };
    dynamoDBServiceStub = sinon.stub(dynamo, "dynamoDBService");
    dynamoDBServiceStub.returns(mockDynamoDBService);

    snsPublishSpy = sinon.spy();
    sinon.stub(sns, "snsService").returns({
      publish: snsPublishSpy,
    });
  });

  afterEach(() => {
    sandbox.restore();
    sinon.restore();
    loggerSpy.restore();
    errorLoggerSpy.restore();
    clock.restore();
  });

  it("Report activity you do not recognise", async () => {
    // Act
    await reportSuspiciousActivityGet(req as Request, res as Response, next);

    // Assert
    expect(res.render).to.have.been.called;
  });

  it("You've already reported this activity", async () => {
    // Arrange
    req.query = { event: "event-id", reported: "true" };
    dynamodbQueryOutput = {
      Items: [
        {
          event_id: { S: "event-id" },
          timestamp: { N: "1680025701" },
          session_id: { S: "session-id" },
          client_id: { S: "vehicleOperatorLicense" },
          event_type: { S: "AUTH_AUTH_CODE_ISSUED" },
          reported_suspicious: { BOOL: true },
          reported_suspicious_time: { N: "1680025701" },
        },
      ],
    };

    // Act
    await reportSuspiciousActivityGet(req as Request, res as Response, next);

    // Assert
    expect(res.render).to.have.been.called;
  });

  describe("Page not found", () => {
    describe("Path param is missing", () => {
      it("event path param is missing", async () => {
        // Arrange
        req.query = { reported: "false" };

        // Act
        await reportSuspiciousActivityGet(
          req as Request,
          res as Response,
          next
        );

        // Assert
        expect(next).to.be.called;
      });
    });
  });

  describe("Sorry, there is a problem with the service", () => {
    it("event param can't be found for this user", async () => {
      // Arrange
      dynamodbQueryOutput = { Items: [] };
      req.query = { event: "event-id", reported: "false" };

      // Act
      await reportSuspiciousActivityGet(req as Request, res as Response, next);

      // Assert
      expect(next).to.be.called;
    });

    it("activity log can't be retrieved for this user", async () => {
      // Arrange
      mockDynamoDBService = {
        getItem(): Promise<DynamoDB.GetItemOutput> {
          throw new Error("DynamoDB error");
        },
        queryItem(): Promise<DynamoDB.Types.QueryOutput> {
          throw new Error("DynamoDB error");
        },
      };
      dynamoDBServiceStub.returns(mockDynamoDBService);

      req.query = { event: "event-id" };

      // Act
      await reportSuspiciousActivityGet(req as Request, res as Response, next);

      // Assert
      expect(errorLoggerSpy).to.have.calledWith("DynamoDB error");
    });
  });

  describe("Submit suspicious activity report", () => {
    it("should send event to SNS with device information", async () => {
      // Arrange
      req.body.page = "1";
      const TXMA_HEADER_VALUE = "TXMA_HEADER_VALUE";
      req.headers = {
        "txma-audit-encoded": TXMA_HEADER_VALUE,
      };

      // Act
      await reportSuspiciousActivityPost(
        req as Request,
        res as Response,
        () => {}
      );

      // Assert
      expect(res.redirect).to.have.been.calledWith(
        "/activity-history/report-activity/done?page=1"
      );

      const snsCall = snsPublishSpy.getCalls()[0];
      const [topic_arn, message] = snsCall.args;

      expect(topic_arn).to.equal(process.env.SUSPICIOUS_ACTIVITY_TOPIC_ARN);
      expect(JSON.parse(message)).to.deep.equal({
        user_id: "user-id",
        email: "test@email.moc",
        event_id: "event-id",
        persistent_session_id: "persistent-session-id",
        session_id: "session-id",
        reported_suspicious_time: 101,
        device_information: TXMA_HEADER_VALUE,
      });
    });

    it("should send event to SNS without device information", async () => {
      // Arrange
      req.body.page = "1";
      req.headers = {};

      // Act
      await reportSuspiciousActivityPost(
        req as Request,
        res as Response,
        () => {}
      );

      // Assert
      expect(res.redirect).to.have.been.calledWith(
        "/activity-history/report-activity/done?page=1"
      );

      const snsCall = snsPublishSpy.getCalls()[0];
      const [topic_arn, message] = snsCall.args;

      expect(topic_arn).to.equal(process.env.SUSPICIOUS_ACTIVITY_TOPIC_ARN);
      expect(JSON.parse(message)).to.deep.equal({
        user_id: "user-id",
        email: "test@email.moc",
        event_id: "event-id",
        persistent_session_id: "persistent-session-id",
        session_id: "session-id",
        reported_suspicious_time: 101,
      });
    });
  });
});
