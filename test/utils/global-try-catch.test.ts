import { describe } from "mocha";
import { Request, Response, NextFunction } from "express";
import {
  globalTryCatch,
  globalTryCatchAsync,
} from "../../src/utils/global-try-catch";
import { logger } from "../../src/utils/logger";
import { sinon, expect } from "../../test/utils/test-utils";

describe("globalTryCatchAsync", () => {
  let next: sinon.SinonSpy;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    next = sinon.spy();
    req = {};
    res = {};
  });

  it("should call the wrapped async function and handle no error", async () => {
    const fn = sinon.stub().resolves(); // Simulate an async function that resolves without error

    const wrapped = globalTryCatchAsync(fn);

    await wrapped(req as Request, res as Response, next as NextFunction);

    expect(fn.calledOnce).to.be.true;
    expect(next.called).to.be.false;
  });

  it("should log the error and call next if the wrapped async function throws an error", async () => {
    const fn = sinon.stub().rejects(new Error("Test error"));

    const loggerSpy = sinon.spy(logger, "error");
    const wrapped = globalTryCatchAsync(fn);

    await wrapped(req as Request, res as Response, next as NextFunction);

    expect(fn.calledOnce).to.be.true;

    expect(loggerSpy.calledOnce).to.be.true;
    expect(loggerSpy.firstCall.args[0].toString()).to.equal(
      "Error: Test error"
    );

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0].message).to.equal("Test error");

    loggerSpy.restore();
  });

  it("should log the error only when next is not provided and the wrapped async function throws an error", async () => {
    const fn = sinon.stub().rejects(new Error("Test error"));

    const loggerSpy = sinon.spy(logger, "error");
    const wrapped = globalTryCatchAsync(fn);

    await wrapped(req as Request, res as Response, next as NextFunction);

    expect(fn.calledOnce).to.be.true;

    expect(loggerSpy.calledOnce).to.be.true;
    expect(loggerSpy.firstCall.args[0].toString()).to.equal(
      "Error: Test error"
    );

    expect(next.calledOnce).to.be.false;

    loggerSpy.restore();
  });
});

describe("globalTryCatch", () => {
  let next: sinon.SinonSpy;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    next = sinon.spy();
    req = {};
    res = {};
  });

  it("should call the wrapped function and handle no error", () => {
    const fn = sinon.stub();

    const wrapped = globalTryCatch(fn);

    wrapped(req as Request, res as Response, next as NextFunction);

    expect(fn.calledOnce).to.be.true;
    expect(next.called).to.be.false;
  });

  it("should log the error and call next if the wrapped function throws an error", () => {
    const fn = sinon.stub().throws(new Error("Test error"));

    const loggerSpy = sinon.spy(logger, "error");
    const wrapped = globalTryCatch(fn);

    wrapped(req as Request, res as Response, next as NextFunction);

    expect(fn.calledOnce).to.be.true;

    expect(loggerSpy.calledOnce).to.be.true;
    expect(loggerSpy.firstCall.args[0].toString()).to.equal(
      "Error: Test error"
    );

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0].message).to.equal("Test error");

    loggerSpy.restore();
  });

  it("should log the error only when next is not provided and the wrapped function throws an error", () => {
    const fn = sinon.stub().throws(new Error("Test error"));

    const loggerSpy = sinon.spy(logger, "error");
    const wrapped = globalTryCatch(fn);

    wrapped(req as Request, res as Response);

    expect(fn.calledOnce).to.be.true;

    expect(loggerSpy.calledOnce).to.be.true;
    expect(loggerSpy.firstCall.args[0].toString()).to.equal(
      "Error: Test error"
    );

    expect(next.calledOnce).to.be.false;

    loggerSpy.restore();
  });
});
