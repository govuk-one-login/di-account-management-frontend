import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import {
  generateExpectedContext,
  validateEncryptionContext,
} from "../decrypt-data";

chai.use(chaiAsPromised);
describe("generateExpectedContext", () => {
  const awsRegion = "aws-region";
  const accountId = "account-id";
  const environment = "environment";
  const userId = "user-id";

  beforeEach(() => {
    process.env.AWS_REGION = awsRegion;
    process.env.ACCOUNT_ID = accountId;
    process.env.ENVIRONMENT = environment;
  });

  afterEach(() => {
    delete process.env.AWS_REGION;
    delete process.env.ACCOUNT_ID;
    delete process.env.ENVIRONMENT;
  });

  it("throws an error when AWS_REGION is not defined", () => {
    delete process.env.AWS_REGION;
    expect(() => generateExpectedContext(userId)).to.throw(
      "Missing AWS_REGION environment variable"
    );
  });

  it("throws an error when ACCOUNT_ID is not defined", () => {
    delete process.env.ACCOUNT_ID;
    expect(() => generateExpectedContext(userId)).to.throw(
      "Missing ACCOUNT_ID environment variable"
    );
  });

  it("throws an error when ENVIRONMENT is not defined", () => {
    delete process.env.ENVIRONMENT;
    expect(() => generateExpectedContext(userId)).to.throw(
      "Missing ENVIRONMENT environment variable"
    );
  });

  it("returns the encryption context", () => {
    const result = generateExpectedContext(userId);
    const expected = {
      origin: awsRegion,
      accountId,
      stage: environment,
      userId,
    };
    expect(result).to.deep.equal(expected);
  });
});

describe("validateEncryptionContext", () => {
  let expected: any;
  const awsRegion = "aws-region";
  const accountId = "account-id";
  const environment = "environment";
  const userId = "user-id";

  beforeEach(() => {
    process.env.AWS_REGION = awsRegion;
    process.env.ACCOUNT_ID = accountId;
    process.env.ENVIRONMENT = environment;
    expected = generateExpectedContext(userId);
  });

  it("throws an error when the context is empty", () => {
    expect(() => validateEncryptionContext({}, expected)).to.throw(
      "Encryption context is empty or undefined"
    );
  });

  it("throws an error when there is a mismatch", () => {
    const wrongContext = {
      origin: awsRegion,
      accountId,
      stage: environment,
      userId: "wrong-user-id",
    };
    expect(() => validateEncryptionContext(wrongContext, expected)).to.throw(
      "Encryption context mismatch: userId"
    );
  });

  it("doesn't throw an error when context matches", () => {
    expect(() => validateEncryptionContext(expected, expected)).to.not.throw();
  });
});
