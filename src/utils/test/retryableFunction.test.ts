import { describe, it, expect, vi } from "vitest";
import { retryableFunction } from "../retryableFunction.js";
import { errors } from "openid-client";
import { IncomingMessage } from "http";

describe("retryableFunction", () => {
  it("should call the function and return its result if it succeeds", async () => {
    const fnStub = vi.fn().mockReturnValue("result");
    const args = [1, 2, 3];
    const attempts = 2;

    const result = await retryableFunction(fnStub, args, attempts);

    expect(fnStub).toHaveBeenCalledOnce();
    expect(fnStub).toHaveBeenCalledWith(...args);
    expect(result).toBe("result");
  });

  it("should retry the function if it fails with a non-OPError", async () => {
    const nonOPError = new Error("Non-OPError");
    const fnStub = vi
      .fn()
      .mockImplementationOnce(() => {
        throw nonOPError;
      })
      .mockReturnValueOnce("result");
    const args = [1, 2, 3];
    const attempts = 2;

    const result = await retryableFunction(fnStub, args, attempts);

    expect(fnStub).toHaveBeenCalledTimes(2);
    expect(fnStub).toHaveBeenNthCalledWith(1, ...args);
    expect(fnStub).toHaveBeenNthCalledWith(2, ...args);
    expect(result).toBe("result");
  });

  it("should throw the error if it is not retryable", async () => {
    const nonRetryableError = new errors.OPError({ error: "error" }, {
      statusCode: 111,
    } as IncomingMessage);
    const fnStub = vi.fn().mockImplementation(() => {
      throw nonRetryableError;
    });
    const args = [1, 2, 3];
    const attempts = 2;

    await expect(retryableFunction(fnStub, args, attempts)).rejects.toThrow(
      nonRetryableError
    );
    expect(fnStub).toHaveBeenCalledOnce();
    expect(fnStub).toHaveBeenCalledWith(...args);
  });

  it("should retry the function if it fails with a retryable error", async () => {
    const retryableError = new errors.OPError({ error: "error" }, {
      statusCode: 500,
    } as IncomingMessage);
    const fnStub = vi
      .fn()
      .mockImplementationOnce(() => {
        throw retryableError;
      })
      .mockReturnValueOnce("result");
    const args = [1, 2, 3];
    const attempts = 2;

    const result = await retryableFunction(fnStub, args, attempts);

    expect(fnStub).toHaveBeenCalledTimes(2);
    expect(fnStub).toHaveBeenNthCalledWith(1, ...args);
    expect(fnStub).toHaveBeenNthCalledWith(2, ...args);
    expect(result).toBe("result");
  });

  it("should throw the error if all retry attempts fail", async () => {
    const retryableError = new errors.OPError({ error: "error" }, {
      statusCode: 500,
    } as IncomingMessage);
    const fnStub = vi.fn().mockImplementation(() => {
      throw retryableError;
    });
    const args = [1, 2, 3];
    const attempts = 2;

    await expect(retryableFunction(fnStub, args, attempts)).rejects.toThrow(
      retryableError
    );
    expect(fnStub).toHaveBeenCalledTimes(2);
    expect(fnStub).toHaveBeenNthCalledWith(1, ...args);
    expect(fnStub).toHaveBeenNthCalledWith(2, ...args);
  });
});
