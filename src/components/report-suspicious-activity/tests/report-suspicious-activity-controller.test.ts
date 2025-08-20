import { describe } from "mocha";
import {
  reportSuspiciousActivityConfirmationGet,
  reportSuspiciousActivityGet,
  reportSuspiciousActivityPost,
} from "../report-suspicious-activity-controller";
import { Request, Response } from "express";
import { sinon } from "../../../../test/utils/test-utils";
import { expect } from "chai";
import * as dynamo from "../../../utils/dynamo";
import * as sns from "../../../utils/sns";
import { DynamoDBService } from "../../../utils/types";
import {
  GetItemCommandOutput,
  QueryCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { logger } from "../../../utils/logger";
import { AwsConfig } from "../../../config/aws";

describe("report suspicious activity controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: any;
  let dynamodbQueryOutput: QueryCommandOutput;
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
      status: sandbox.fake(),
    };
    next = sandbox.fake(() => {});
    dynamodbQueryOutput = {
      $metadata: undefined,
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
      getItem(): Promise<GetItemCommandOutput> {
        return Promise.resolve(undefined);
      },
      queryItem(): Promise<QueryCommandOutput> {
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
    const configFuncs = require("../../../config");
    sandbox.stub(configFuncs, "reportSuspiciousActivity").callsFake(() => {
      return true;
    });
    // Act
    await reportSuspiciousActivityGet(req as Request, res as Response, next);

    // Assert
    expect(res.render).to.have.been.called;
  });

  it("Should render 404 in GET view when report suspicious activity is false", async () => {
    const configFuncs = require("../../../config");
    sandbox.stub(configFuncs, "reportSuspiciousActivity").callsFake(() => {
      return false;
    });
    // Act
    await reportSuspiciousActivityGet(req as Request, res as Response, next);

    // Assert
    expect(res.status).to.have.been.calledOnceWith(404);
    expect(res.render).to.have.been.calledOnceWith("common/errors/404.njk");
  });

  it("Should call next when report parameters don't pass validation", async () => {
    const nextFake = sinon.fake();
    req.query = {
      event: "",
    };

    await reportSuspiciousActivityGet(
      req as Request,
      res as Response,
      nextFake
    );

    expect(nextFake).to.have.been.calledOnce;
  });

  it("You've already reported this activity", async () => {
    const configFuncs = require("../../../config");
    sandbox.stub(configFuncs, "reportSuspiciousActivity").callsFake(() => {
      return true;
    });
    // Arrange
    req.query = { event: "event-id", reported: "true" };
    dynamodbQueryOutput = {
      $metadata: undefined,
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
        const configFuncs = require("../../../config");
        sandbox.stub(configFuncs, "reportSuspiciousActivity").callsFake(() => {
          return true;
        });

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
      const configFuncs = require("../../../config");
      sandbox.stub(configFuncs, "reportSuspiciousActivity").callsFake(() => {
        return true;
      });
      // Arrange
      dynamodbQueryOutput = { $metadata: undefined, Items: [] };
      req.query = { event: "event-id", reported: "false" };

      // Act
      await reportSuspiciousActivityGet(req as Request, res as Response, next);

      // Assert
      expect(next).to.be.called;
    });

    it("activity log can't be retrieved for this user", async () => {
      const configFuncs = require("../../../config");
      sandbox.stub(configFuncs, "reportSuspiciousActivity").callsFake(() => {
        return true;
      });
      // Arrange
      mockDynamoDBService = {
        getItem(): Promise<GetItemCommandOutput> {
          throw new Error("DynamoDB error");
        },
        queryItem(): Promise<QueryCommandOutput> {
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
      const configFuncs = require("../../../config");
      sandbox.stub(configFuncs, "reportSuspiciousActivity").callsFake(() => {
        return true;
      });
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

      const configFuncs = require("../../../config");
      sandbox.stub(configFuncs, "reportSuspiciousActivity").callsFake(() => {
        return true;
      });

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

    it("should send event to SNS without page information", async () => {
      // Arrange
      req.body.page = "AAA";
      req.headers = {};

      const configFuncs = require("../../../config");
      sandbox.stub(configFuncs, "reportSuspiciousActivity").callsFake(() => {
        return true;
      });

      // Act
      await reportSuspiciousActivityPost(
        req as Request,
        res as Response,
        () => {}
      );

      // Assert
      expect(res.redirect).to.have.been.calledWith(
        "/activity-history/report-activity/done"
      );
    });

    it("Should render 404 in POST view when report suspicious activity is false", async () => {
      const configFuncs = require("../../../config");
      sandbox.stub(configFuncs, "reportSuspiciousActivity").callsFake(() => {
        return false;
      });
      // Act
      await reportSuspiciousActivityPost(
        req as Request,
        res as Response,
        () => {}
      );

      // Assert
      expect(res.status).to.have.been.calledOnceWith(404);
      expect(res.render).to.have.been.calledOnceWith("common/errors/404.njk");
    });

    it("Should render 404 in CONFIRMATION view when report suspicious activity is false", async () => {
      const configFuncs = require("../../../config");
      sandbox.stub(configFuncs, "reportSuspiciousActivity").callsFake(() => {
        return false;
      });
      // Act
      await reportSuspiciousActivityConfirmationGet(
        req as Request,
        res as Response,
        () => {}
      );

      // Assert
      expect(res.status).to.have.been.calledOnceWith(404);
      expect(res.render).to.have.been.calledOnceWith("common/errors/404.njk");
    });

    it("Should call next when report parameters don't pass validation", async () => {
      const nextFake = sinon.fake();
      req.query = {
        page: ["1"],
      };

      await reportSuspiciousActivityConfirmationGet(
        req as Request,
        res as Response,
        nextFake
      );

      expect(nextFake).to.have.been.calledOnce;
    });
  });
});
