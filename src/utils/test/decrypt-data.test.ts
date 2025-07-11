import sinon from "sinon";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { describe } from "mocha";
import {
  generateExpectedContext,
  validateEncryptionContext,
} from "../decrypt-data";
import { logger } from "../logger";
import * as getHashedAccessCheckValueModule from "../get-access-check-value";

chai.use(chaiAsPromised);

describe("generateExpectedContext", () => {
  const awsRegion = "aws-region";
  const accountId = "account-id";
  const environment = "environment";
  const accessCheckValue = "accessCheckValue";
  const userId = "user-id";
  let errorLoggerSpy: sinon.SinonSpy;
  let stub: sinon.SinonStub;

  beforeEach(() => {
    stub = sinon
      .stub(getHashedAccessCheckValueModule, "getHashedAccessCheckValue")
      .returns(Promise.resolve(accessCheckValue));
    process.env.AWS_REGION = awsRegion;
    process.env.ACCOUNT_ID = accountId;
    process.env.ENVIRONMENT = environment;
    process.env.VERIFY_ACCESS_VALUE = accessCheckValue;
    errorLoggerSpy = sinon.spy(logger, "error");
  });

  afterEach(() => {
    delete process.env.AWS_REGION;
    delete process.env.ACCOUNT_ID;
    delete process.env.ENVIRONMENT;
    delete process.env.VERIFY_ACCESS_VALUE;
    errorLoggerSpy.restore();
    stub.restore();
  });

  ["AWS_REGION", "ACCOUNT_ID", "VERIFY_ACCESS_VALUE", "ENVIRONMENT"].forEach(
    (variable) => {
      it(`throws an error when ${variable} is not defined`, async () => {
        delete process.env[variable];
        try {
          await generateExpectedContext(userId);
          expect.fail("Expected function to throw an error but it did not");
        } catch {
          expect(errorLoggerSpy).to.have.been.calledWith(
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
    expect(result).to.deep.equal(expected);
  });
});

describe("validateEncryptionContext", () => {
  let expected: any;
  const awsRegion = "aws-region";
  const accountId = "account-id";
  const environment = "environment";
  const accessCheckValue = "accessCheckValue";
  const userId = "user-id";
  let errorLoggerSpy: sinon.SinonSpy;
  let stub: sinon.SinonStub;

  beforeEach(async () => {
    stub = sinon
      .stub(getHashedAccessCheckValueModule, "getHashedAccessCheckValue")
      .returns(Promise.resolve(accessCheckValue));
    process.env.AWS_REGION = awsRegion;
    process.env.ACCOUNT_ID = accountId;
    process.env.ENVIRONMENT = environment;
    process.env.VERIFY_ACCESS_VALUE = accessCheckValue;
    expected = await generateExpectedContext(userId);
    errorLoggerSpy = sinon.spy(logger, "error");
  });

  afterEach(() => {
    delete process.env.AWS_REGION;
    delete process.env.ACCOUNT_ID;
    delete process.env.ENVIRONMENT;
    delete process.env.VERIFY_ACCESS_VALUE;
    errorLoggerSpy.restore();
    stub.restore();
  });

  it("logs an error when the context is empty", () => {
    validateEncryptionContext({}, expected);

    expect(errorLoggerSpy).to.have.been.calledWith(
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

    expect(errorLoggerSpy).to.have.been.calledWith(
      "Decrypt data: encryption context mismatch: userId"
    );
  });

  it("doesn't throw an error when context matches", () => {
    validateEncryptionContext(expected, expected);
    expect(errorLoggerSpy).to.not.have.been.called;
  });
});
