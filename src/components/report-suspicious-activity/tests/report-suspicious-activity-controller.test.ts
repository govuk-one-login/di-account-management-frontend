import { describe } from "mocha";
import {
  reportSuspiciousActivityGet,
  reportSuspiciousActivityPost,
} from "../report-suspicious-activity-controller";
import { Request, Response } from "express";
import { sinon } from "../../../../test/utils/test-utils";
import { expect } from "chai";
import * as dynamo from "../../../utils/dynamo";
import { DynamoDBService } from "../../../utils/types";
import { DynamoDB } from "aws-sdk";
import { logger } from "../../../utils/logger";
import { AwsConfig } from "src/config/aws";

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

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    loggerSpy = sinon.spy(logger, "info");
    errorLoggerSpy = sinon.spy(logger, "error");

    req = {
      query: { event: "event-id", reported: "false" },
      session: {
        user: {
          email: "test@email.moc",
        },
      } as any,
      log: logger,
      body: {
        page: "",
      },
    };
    res = {
      locals: {
        trace: "trace-id",
      },
      render: sandbox.fake(),
    };
    next = sandbox.fake();
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
  });

  afterEach(() => {
    sandbox.restore();
    sinon.restore();
    loggerSpy.restore();
    errorLoggerSpy.restore();
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
    it("should send event to SNS", async () => {
      // Arrange
      req.body.page = "1";

      // Act
      await reportSuspiciousActivityPost(req as Request, res as Response);

      // Assert
      expect(res.render).to.have.been.calledWith(
        "report-suspicious-activity/success.njk",
        {
          backLink: "/activity-history?page=1",
          email: "test@email.moc",
          contactLink: sinon.match.any,
          changePasswordLink: sinon.match.any,
        }
      );

      expect(loggerSpy).to.have.calledWith(
        "TBD Send event to SNS to trigger back processing."
      );
    });
  });
});
