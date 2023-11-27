import { describe } from "mocha";
import { reportSuspiciousActivityGet } from "../report-suspicious-activity-controller";
import { Request, Response } from "express";
import { sinon } from "../../../../test/utils/test-utils";
import { expect } from "chai";
import * as dynamo from "../../../utils/dynamo";
import { DynamoDBService } from "../../../utils/types";
import { DynamoDB } from "aws-sdk";
import { logger } from "../../../utils/logger";

describe("report suspicious activity controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: any;
  let dynamodbQueryOutput: DynamoDB.Types.QueryOutput;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      query: { event: "event-id", reported: "false" },
      session: {
        user: {},
      } as any,
      log: logger,
    };
    res = {
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
    const mockDynamoDBService: DynamoDBService = {
      getItem(): Promise<DynamoDB.GetItemOutput> {
        return Promise.resolve(undefined);
      },
      queryItem(): Promise<DynamoDB.Types.QueryOutput> {
        return Promise.resolve(dynamodbQueryOutput);
      },
    };
    const dynamoDBServiceStub = sinon.stub(dynamo, "dynamoDBService");
    dynamoDBServiceStub.returns(mockDynamoDBService);
  });

  afterEach(() => {
    sandbox.restore();
    sinon.restore();
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
    describe("reported param is not a boolean", () => {
      it("reported path param is not a boolean value", async () => {
        // Arrange
        req.query = { event: "event-id", reported: "not boolean" };

        // Act
        await reportSuspiciousActivityGet(
          req as Request,
          res as Response,
          next
        );

        // Assert
        expect(next).to.be.called;
      });
      it("reported path param is missing", async () => {
        // Arrange
        req.query = { event: "event-id" };

        // Act
        await reportSuspiciousActivityGet(
          req as Request,
          res as Response,
          next
        );

        // Assert
        expect(next).to.be.called;
      });
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
    it("reported is false but event has already been reported", async () => {
      // Arrange
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
      expect(next).to.be.called;
    });
    it("event param can't be found for this user", async () => {
      // Arrange
      dynamodbQueryOutput = { Items: [] };
      req.query = { event: "event-id", reported: "false" };

      // Act
      await reportSuspiciousActivityGet(req as Request, res as Response, next);

      // Assert
      expect(next).to.be.called;
    });
  });
});
