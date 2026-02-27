import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateExpectedContext,
  validateEncryptionContext,
} from "../decrypt-data.js";
import { logger } from "../logger.js";
import * as getHashedAccessCheckValueModule from "../get-access-check-value.js";

describe("generateExpectedContext", () => {
  const awsRegion = "aws-region";
  const accountId = "account-id";
  const environment = "environment";
  const accessCheckValue = "accessCheckValue";
  const userId = "user-id";
  let errorLoggerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.spyOn(
      getHashedAccessCheckValueModule,
      "getHashedAccessCheckValue"
    ).mockResolvedValue(accessCheckValue);
    process.env.AWS_REGION = awsRegion;
    process.env.ACCOUNT_ID = accountId;
    process.env.ENVIRONMENT = environment;
    process.env.VERIFY_ACCESS_VALUE = accessCheckValue;
    errorLoggerSpy = vi.spyOn(logger, "error");
  });

  afterEach(() => {
    delete process.env.AWS_REGION;
    delete process.env.ACCOUNT_ID;
    delete process.env.ENVIRONMENT;
    delete process.env.VERIFY_ACCESS_VALUE;
    vi.restoreAllMocks();
  });

  ["AWS_REGION", "ACCOUNT_ID", "VERIFY_ACCESS_VALUE", "ENVIRONMENT"].forEach(
    (variable) => {
      it(`throws an error when ${variable} is not defined`, async () => {
        delete process.env[variable];
        try {
          await generateExpectedContext(userId);
          expect.fail("Expected function to throw an error but it did not");
        } catch {
          expect(errorLoggerSpy).toHaveBeenCalledWith(
            `Decrypt data: failed with the error Missing ${variable} environment variable`
          );
        }
      });
    }
  );

  it("returns the encryption context", async () => {
    const result = await generateExpectedContext(userId);
    const expected = {
      origin: awsRegion,
      accountId,
      stage: environment,
      userId,
      accessCheckValue,
    };
    expect(result).toEqual(expected);
  });
});

describe("validateEncryptionContext", () => {
  let expected: any;
  const awsRegion = "aws-region";
  const accountId = "account-id";
  const environment = "environment";
  const accessCheckValue = "accessCheckValue";
  const userId = "user-id";
  let errorLoggerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.spyOn(
      getHashedAccessCheckValueModule,
      "getHashedAccessCheckValue"
    ).mockResolvedValue(accessCheckValue);
    process.env.AWS_REGION = awsRegion;
    process.env.ACCOUNT_ID = accountId;
    process.env.ENVIRONMENT = environment;
    process.env.VERIFY_ACCESS_VALUE = accessCheckValue;
    expected = await generateExpectedContext(userId);
    errorLoggerSpy = vi.spyOn(logger, "error");
  });

  afterEach(() => {
    delete process.env.AWS_REGION;
    delete process.env.ACCOUNT_ID;
    delete process.env.ENVIRONMENT;
    delete process.env.VERIFY_ACCESS_VALUE;
    vi.restoreAllMocks();
  });

  it("logs an error when the context is empty", () => {
    validateEncryptionContext({}, expected);

    expect(errorLoggerSpy).toHaveBeenCalledWith(
      "Decrypt data: encryption context is empty or undefined"
    );
  });

  it("logs an error when there is a mismatch", () => {
    const wrongContext = {
      origin: awsRegion,
      accountId,
      stage: environment,
      userId: "wrong-user-id",
      accessCheckValue,
    };

    validateEncryptionContext(wrongContext, expected);

    expect(errorLoggerSpy).toHaveBeenCalledWith(
      "Decrypt data: encryption context mismatch: userId"
    );
  });

  it("doesn't throw an error when context matches", () => {
    validateEncryptionContext(expected, expected);
    expect(errorLoggerSpy).not.toHaveBeenCalled();
  });
});
