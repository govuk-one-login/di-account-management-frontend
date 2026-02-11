import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  reportSuspiciousActivityConfirmationGet,
  reportSuspiciousActivityGet,
  reportSuspiciousActivityPost,
} from "../report-suspicious-activity-controller.js";
import { Request, Response } from "express";
import * as dynamo from "../../../utils/dynamo.js";
import * as sns from "../../../utils/sns";
import * as config from "../../../config.js";
import { DynamoDBService } from "../../../utils/types";
import {
  GetItemCommandOutput,
  QueryCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { logger } from "../../../utils/logger.js";

describe("report suspicious activity controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: any;
  let dynamodbQueryOutput: QueryCommandOutput;
  let errorLoggerSpy: ReturnType<typeof vi.spyOn>;
  let mockDynamoDBService: DynamoDBService;
  let dynamoDBServiceStub: ReturnType<typeof vi.spyOn>;
  let snsPublishSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    errorLoggerSpy = vi.spyOn(logger, "error");
    vi.useFakeTimers();
    vi.setSystemTime(new Date(101));

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
      render: vi.fn(),
      redirect: vi.fn(() => {}),
      status: vi.fn(),
    };
    next = vi.fn(() => {});
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
    dynamoDBServiceStub = vi.spyOn(dynamo, "dynamoDBService");
    dynamoDBServiceStub.mockReturnValue(mockDynamoDBService);

    snsPublishSpy = vi.fn();
    vi.spyOn(sns, "snsService").mockReturnValue({
      publish: snsPublishSpy,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("Report activity you do not recognise", async () => {
    vi.spyOn(config, "reportSuspiciousActivity").mockReturnValue(true);
    await reportSuspiciousActivityGet(req as Request, res as Response, next);
    expect(res.render).toHaveBeenCalled();
  });

  it("Should render 404 in GET view when report suspicious activity is false", async () => {
    vi.spyOn(config, "reportSuspiciousActivity").mockReturnValue(false);
    await reportSuspiciousActivityGet(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledOnce();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledOnce();
    expect(res.render).toHaveBeenCalledWith("common/errors/404.njk");
  });

  it("Should call next when the event query string parameter fails validation", async () => {
    vi.spyOn(config, "reportSuspiciousActivity").mockReturnValue(true);
    const nextFake = vi.fn();
    req.query = { event: "" };
    await reportSuspiciousActivityGet(
      req as Request,
      res as Response,
      nextFake
    );
    expect(nextFake).toHaveBeenCalledOnce();
  });

  it("You've already reported this activity", async () => {
    vi.spyOn(config, "reportSuspiciousActivity").mockReturnValue(true);
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
    await reportSuspiciousActivityGet(req as Request, res as Response, next);
    expect(res.render).toHaveBeenCalled();
  });

  describe("Page not found", () => {
    describe("Path param is missing", () => {
      it("event path param is missing", async () => {
        req.query = { reported: "false" };
        vi.spyOn(config, "reportSuspiciousActivity").mockReturnValue(true);
        await reportSuspiciousActivityGet(
          req as Request,
          res as Response,
          next
        );
        expect(next).toHaveBeenCalled();
      });
    });
  });

  describe("Sorry, there is a problem with the service", () => {
    it("event param can't be found for this user", async () => {
      vi.spyOn(config, "reportSuspiciousActivity").mockReturnValue(true);
      dynamodbQueryOutput = { $metadata: undefined, Items: [] };
      req.query = { event: "event-id", reported: "false" };
      await reportSuspiciousActivityGet(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it("activity log can't be retrieved for this user", async () => {
      vi.spyOn(config, "reportSuspiciousActivity").mockReturnValue(true);
      mockDynamoDBService = {
        getItem(): Promise<GetItemCommandOutput> {
          throw new Error("DynamoDB error");
        },
        queryItem(): Promise<QueryCommandOutput> {
          throw new Error("DynamoDB error");
        },
      };
      dynamoDBServiceStub.mockReturnValue(mockDynamoDBService);
      req.query = { event: "event-id" };
      await reportSuspiciousActivityGet(req as Request, res as Response, next);
      expect(errorLoggerSpy).toHaveBeenCalledWith("DynamoDB error");
    });
  });

  describe("Submit suspicious activity report", () => {
    it("should send event to SNS with device information", async () => {
      vi.spyOn(config, "reportSuspiciousActivity").mockReturnValue(true);
      req.body.page = "1";
      const TXMA_HEADER_VALUE = "TXMA_HEADER_VALUE";
      req.headers = { "txma-audit-encoded": TXMA_HEADER_VALUE };
      await reportSuspiciousActivityPost(
        req as Request,
        res as Response,
        () => {}
      );
      expect(res.redirect).toHaveBeenCalledWith(
        "/activity-history/report-activity/done?page=1"
      );
      const [topic_arn, message] = snsPublishSpy.mock.calls[0];
      expect(topic_arn).toBe(process.env.SUSPICIOUS_ACTIVITY_TOPIC_ARN);
      expect(JSON.parse(message)).toEqual({
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
      req.body.page = "1";
      req.headers = {};
      vi.spyOn(config, "reportSuspiciousActivity").mockReturnValue(true);
      await reportSuspiciousActivityPost(
        req as Request,
        res as Response,
        () => {}
      );
      expect(res.redirect).toHaveBeenCalledWith(
        "/activity-history/report-activity/done?page=1"
      );
      const [topic_arn, message] = snsPublishSpy.mock.calls[0];
      expect(topic_arn).toBe(process.env.SUSPICIOUS_ACTIVITY_TOPIC_ARN);
      expect(JSON.parse(message)).toEqual({
        user_id: "user-id",
        email: "test@email.moc",
        event_id: "event-id",
        persistent_session_id: "persistent-session-id",
        session_id: "session-id",
        reported_suspicious_time: 101,
      });
    });

    it("should send event to SNS without page information", async () => {
      req.body.page = "AAA";
      req.headers = {};
      vi.spyOn(config, "reportSuspiciousActivity").mockReturnValue(true);
      await reportSuspiciousActivityPost(
        req as Request,
        res as Response,
        () => {}
      );
      expect(res.redirect).toHaveBeenCalledWith(
        "/activity-history/report-activity/done"
      );
    });

    it("Should render 404 in POST view when report suspicious activity is false", async () => {
      vi.spyOn(config, "reportSuspiciousActivity").mockReturnValue(false);
      await reportSuspiciousActivityPost(
        req as Request,
        res as Response,
        () => {}
      );
      expect(res.status).toHaveBeenCalledOnce();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.render).toHaveBeenCalledOnce();
      expect(res.render).toHaveBeenCalledWith("common/errors/404.njk");
    });

    it("Should render 404 in CONFIRMATION view when report suspicious activity is false", async () => {
      vi.spyOn(config, "reportSuspiciousActivity").mockReturnValue(false);
      await reportSuspiciousActivityConfirmationGet(
        req as Request,
        res as Response,
        () => {}
      );
      expect(res.status).toHaveBeenCalledOnce();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.render).toHaveBeenCalledOnce();
      expect(res.render).toHaveBeenCalledWith("common/errors/404.njk");
    });

    it("Should call next when the page query string parameter fails validation", async () => {
      vi.spyOn(config, "reportSuspiciousActivity").mockReturnValue(true);
      const nextFake = vi.fn();
      req.query = { page: ["1"] };
      await reportSuspiciousActivityConfirmationGet(
        req as Request,
        res as Response,
        nextFake
      );
      expect(nextFake).toHaveBeenCalledOnce();
    });
  });
});
