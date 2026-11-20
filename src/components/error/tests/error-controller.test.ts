import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Request, Response } from "express";
import { UNKNOWN_ERROR_MESSAGE, errorGet } from "../error-controller.ts";
import { logger } from "../../../utils/logger";
import {
  RequestBuilder,
  ResponseBuilder,
} from "../../../../test/utils/builders";

describe("error controller", () => {
  let res: Partial<Response>;
  let errorLoggerSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    res = new ResponseBuilder().withLocals({ trace: "trace-id" }).build();

    errorLoggerSpy = vi.spyOn(logger, "error");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("errorGet", () => {
    it("throws an error containing the msg param and logs the stack trace", () => {
      const validErrorMessage = "RemovePasskeyProgressButtonTimeout";

      const req = new RequestBuilder()
        .withQuery({ msg: validErrorMessage })
        .build();

      expect(() => errorGet(req as Request, res as Response)).toThrow(
        validErrorMessage
      );

      expect(errorLoggerSpy).toHaveBeenCalledWith(
        { trace: "trace-id" },
        validErrorMessage
      );
    });

    it("throws the default unknown error when msg is missing and logs the stack trace", () => {
      const req = new RequestBuilder().withQuery({}).build();

      expect(() => errorGet(req as Request, res as Response)).toThrow(
        UNKNOWN_ERROR_MESSAGE
      );

      expect(errorLoggerSpy).toHaveBeenCalledWith(
        { trace: "trace-id" },
        UNKNOWN_ERROR_MESSAGE
      );
    });

    it("throws the default unknown error when msg is not a string and logs the stack trace", () => {
      const req = new RequestBuilder()
        .withQuery({ msg: { a: 1, b: 2 } })
        .build();

      expect(() => errorGet(req as Request, res as Response)).toThrow(
        UNKNOWN_ERROR_MESSAGE
      );

      expect(errorLoggerSpy).toHaveBeenCalledWith(
        { trace: "trace-id" },
        UNKNOWN_ERROR_MESSAGE
      );
    });
  });
});
