import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { metricsMiddleware } from "../../../src/middleware/metrics-middlware.js";
import { Request, Response, NextFunction } from "express";
import { Metrics } from "@aws-lambda-powertools/metrics";
import { logger } from "../../../src/utils/logger.js";

describe("metricsMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let finishCallback: () => void;

  beforeEach(() => {
    req = {};
    res = {
      statusCode: 200,
      on: vi.fn((event: string, callback: () => void) => {
        if (event === "finish") {
          finishCallback = callback;
        }
        return res as Response;
      }),
    };
    next = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create metrics instance with default namespace and service name", () => {
    const middleware = metricsMiddleware();

    middleware(req as Request, res as Response, next);

    expect(req.metrics).toBeDefined();
    expect(req.metrics).toBeInstanceOf(Metrics);
    expect(next).toHaveBeenCalledOnce();
  });

  it("should create metrics instance with custom namespace and service name", () => {
    const middleware = metricsMiddleware("Custom Namespace", "Custom Service");

    middleware(req as Request, res as Response, next);

    expect(req.metrics).toBeDefined();
    expect(req.metrics).toBeInstanceOf(Metrics);
    expect(next).toHaveBeenCalledOnce();
  });

  it("should register finish event listener", () => {
    const middleware = metricsMiddleware();

    middleware(req as Request, res as Response, next);

    expect(res.on).toHaveBeenCalledWith("finish", expect.any(Function));
  });

  it("should add metric and publish on response finish with status 200", async () => {
    const middleware = metricsMiddleware();
    const addMetricSpy = vi.spyOn(Metrics.prototype, "addMetric");
    const publishSpy = vi.spyOn(Metrics.prototype, "publishStoredMetrics");

    middleware(req as Request, res as Response, next);

    res.statusCode = 200;
    finishCallback();

    // Wait for async operation
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(addMetricSpy).toHaveBeenCalledWith("HttpStatus_200", "Count", 1);
    expect(publishSpy).toHaveBeenCalledOnce();
  });

  it("should add metric and publish on response finish with status 404", async () => {
    const middleware = metricsMiddleware();
    const addMetricSpy = vi.spyOn(Metrics.prototype, "addMetric");
    const publishSpy = vi.spyOn(Metrics.prototype, "publishStoredMetrics");

    middleware(req as Request, res as Response, next);

    res.statusCode = 404;
    finishCallback();

    // Wait for async operation
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(addMetricSpy).toHaveBeenCalledWith("HttpStatus_404", "Count", 1);
    expect(publishSpy).toHaveBeenCalledOnce();
  });

  it("should add metric and publish on response finish with status 500", async () => {
    const middleware = metricsMiddleware();
    const addMetricSpy = vi.spyOn(Metrics.prototype, "addMetric");
    const publishSpy = vi.spyOn(Metrics.prototype, "publishStoredMetrics");

    middleware(req as Request, res as Response, next);

    res.statusCode = 500;
    finishCallback();

    // Wait for async operation
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(addMetricSpy).toHaveBeenCalledWith("HttpStatus_500", "Count", 1);
    expect(publishSpy).toHaveBeenCalledOnce();
  });

  it("should log error when publishStoredMetrics fails", async () => {
    const middleware = metricsMiddleware();
    const error = new Error("Publish failed");
    const loggerErrorSpy = vi.spyOn(logger, "error");
    vi.spyOn(Metrics.prototype, "publishStoredMetrics").mockImplementation(
      () => {
        throw error;
      }
    );

    middleware(req as Request, res as Response, next);

    finishCallback();

    // Wait for async operation
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      error,
      "Failed to publish metric"
    );
  });
});
