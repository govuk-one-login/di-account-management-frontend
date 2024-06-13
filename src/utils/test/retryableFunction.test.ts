import { expect } from "chai";
import sinon, { SinonStub } from "sinon";
import { retryableFunction } from "../retryableFunction.js";
import { errors } from "openid-client";
import { IncomingMessage } from "http";

describe("retryableFunction", () => {
  it("should call the function and return its result if it succeeds", async () => {
    const fnStub: SinonStub = sinon.stub().returns("result");
    const args = [1, 2, 3];
    const attempts = 2;

    const result = await retryableFunction(fnStub, args, attempts);

    expect(fnStub.calledOnceWithExactly(...args)).to.be.true;
    expect(result).to.equal("result");
  });

  it("should retry the function if it fails with a non-OPError", async () => {
    const nonOPError = new Error("Non-OPError");
    const fnStub: SinonStub = sinon
      .stub()
      .onFirstCall()
      .throws(nonOPError)
      .onSecondCall()
      .returns("result");
    const args = [1, 2, 3];
    const attempts = 2;

    const result = await retryableFunction(fnStub, args, attempts);

    expect(fnStub.calledTwice).to.be.true;
    expect(fnStub.firstCall.calledWithExactly(...args)).to.be.true;
    expect(fnStub.secondCall.calledWithExactly(...args)).to.be.true;
    expect(result).to.equal("result");
  });

  it("should throw the error if it is not retryable", async () => {
    const nonRetryableError = new errors.OPError({ error: "error" }, {
      statusCode: 111,
    } as IncomingMessage);
    const fnStub: SinonStub = sinon.stub().throws(nonRetryableError);
    const args = [1, 2, 3];
    const attempts = 2;

    await expect(retryableFunction(fnStub, args, attempts)).to.be.rejectedWith(
      nonRetryableError
    );
    expect(fnStub.calledOnceWithExactly(...args)).to.be.true;
  });

  it("should retry the function if it fails with a retryable error", async () => {
    const retryableError = new errors.OPError({ error: "error" }, {
      statusCode: 500,
    } as IncomingMessage);
    const fnStub: SinonStub = sinon
      .stub()
      .onFirstCall()
      .throws(retryableError)
      .onSecondCall()
      .returns("result");
    const args = [1, 2, 3];
    const attempts = 2;

    const result = await retryableFunction(fnStub, args, attempts);

    expect(fnStub.calledTwice).to.be.true;
    expect(fnStub.firstCall.calledWithExactly(...args)).to.be.true;
    expect(fnStub.secondCall.calledWithExactly(...args)).to.be.true;
    expect(result).to.equal("result");
  });

  it("should throw the error if all retry attempts fail", async () => {
    const retryableError = new errors.OPError({ error: "error" }, {
      statusCode: 500,
    } as IncomingMessage);
    const fnStub: SinonStub = sinon.stub().throws(retryableError);
    const args = [1, 2, 3];
    const attempts = 2;

    await expect(retryableFunction(fnStub, args, attempts)).to.be.rejectedWith(
      retryableError
    );
    expect(fnStub.calledTwice).to.be.true;
    expect(fnStub.firstCall.calledWithExactly(...args)).to.be.true;
    expect(fnStub.secondCall.calledWithExactly(...args)).to.be.true;
  });
});
