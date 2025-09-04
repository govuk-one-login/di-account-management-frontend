import { logger, logWarn } from "./logger";
import { errors } from "openid-client";

const RETRYABLE_ERRORS = [500, 502, 503, 504, 408, 429];

const isRetryableError = (statusCode: number) =>
  RETRYABLE_ERRORS.includes(statusCode);

export async function retryableFunction<T, A extends any[]>(
  fn: (...args: A) => T,
  args: A,
  attempts = 2
): Promise<T> {
  try {
    return await fn(...args);
  } catch (error) {
    const attemptsRemaining = attempts - 1;

    if (
      error instanceof errors.OPError &&
      error.response &&
      !isRetryableError(error.response.statusCode)
    ) {
      throw error;
    }

    if (attemptsRemaining <= 0) {
      throw error;
    }
    logWarn(
      logger,
      `function call failed, retrying. ${attemptsRemaining} attempt(s) remaining `,
      error
    );
    return await retryableFunction(fn, args, attemptsRemaining);
  }
}
