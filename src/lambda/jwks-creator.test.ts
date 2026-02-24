import { expect, sinon } from "../../test/utils/test-utils";
import { handler } from "./jwks-creator";
import { kmsService } from "../utils/kms";
import { s3Client } from "../config/aws";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { generateKeyPairSync } from "node:crypto";
import type { CloudFormationCustomResourceEvent, Context } from "aws-lambda";

describe("jwks-creator handler", () => {
  let sandbox: sinon.SinonSandbox;

  const mockEvent = (
    requestType: CloudFormationCustomResourceEvent["RequestType"]
  ): CloudFormationCustomResourceEvent =>
    ({
      RequestType: requestType,
      ServiceToken: "service-token",
      ResponseURL: "https://example.com/response",
      StackId: "stack-id",
      RequestId: "request-id",
      LogicalResourceId: "logical-id",
      ResourceType: "Custom::JwksCreator",
      ResourceProperties: {},
    }) as CloudFormationCustomResourceEvent;

  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: "fn",
    functionVersion: "1",
    invokedFunctionArn: "arn",
    memoryLimitInMB: "128",
    awsRequestId: "aws-request-id",
    logGroupName: "log-group",
    logStreamName: "log-stream",
    getRemainingTimeInMillis: () => 1000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  };

  const createPublicKeyDer = (): Buffer => {
    const { publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicExponent: 0x10001,
    });
    return publicKey.export({ type: "spki", format: "der" }) as Buffer;
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    process.env.JAR_RSA_ENCRYPTION_KEY_ALIAS = "alias/jar-key";
    process.env.BUCKET_NAME = "test-bucket";
  });

  afterEach(() => {
    sandbox.restore();
    delete process.env.JAR_RSA_ENCRYPTION_KEY_ALIAS;
    delete process.env.BUCKET_NAME;
  });

  it("generates jwks and uploads to s3 for create requests", async () => {
    const sendStub = sandbox.stub().resolves({});
    sandbox.stub(s3Client, "getClient").returns({ send: sendStub } as any);
    sandbox.stub(kmsService, "getPublicKey").resolves({
      PublicKey: createPublicKeyDer(),
    } as any);
    sandbox.stub(kmsService, "describeKey").resolves({
      KeyMetadata: { KeyId: "kms-key-id-1" },
    } as any);
    const fetchStub = sandbox
      .stub(globalThis, "fetch")
      .resolves({ ok: true, statusText: "OK" } as Response);

    await handler(mockEvent("Create"), mockContext);

    expect(kmsService.getPublicKey).to.have.been.calledOnceWith({
      KeyId: "alias/jar-key",
    });
    expect(kmsService.describeKey).to.have.been.calledOnceWith({
      KeyId: "alias/jar-key",
    });
    expect(sendStub).to.have.been.calledOnce;
    const command = sendStub.firstCall.args[0] as PutObjectCommand;
    expect(command).to.be.instanceOf(PutObjectCommand);
    expect(command.input.Bucket).to.equal("test-bucket");
    expect(command.input.Key).to.equal("jwks.json");
    expect(command.input.ContentType).to.equal("application/json");
    expect(command.input.Body).to.include('"kid":"kms-key-id-1"');
    expect(command.input.Body).to.include('"use":"enc"');
    expect(fetchStub).to.have.been.calledOnce;
  });

  it("skips jwks generation for delete requests and reports success", async () => {
    const fetchStub = sandbox
      .stub(globalThis, "fetch")
      .resolves({ ok: true, statusText: "OK" } as Response);
    const s3Stub = sandbox.stub(s3Client, "getClient");
    const publicKeyStub = sandbox.stub(kmsService, "getPublicKey");
    const describeKeyStub = sandbox.stub(kmsService, "describeKey");

    await handler(mockEvent("Delete"), mockContext);

    expect(publicKeyStub).to.not.have.been.called;
    expect(describeKeyStub).to.not.have.been.called;
    expect(s3Stub).to.not.have.been.called;
    expect(fetchStub).to.have.been.calledOnce;
  });

  it("sends failed response when alias env var is missing", async () => {
    delete process.env.JAR_RSA_ENCRYPTION_KEY_ALIAS;
    const fetchStub = sandbox
      .stub(globalThis, "fetch")
      .resolves({ ok: true, statusText: "OK" } as Response);

    await handler(mockEvent("Create"), mockContext);

    expect(fetchStub).to.have.been.calledOnce;
    const [, options] = fetchStub.firstCall.args;
    expect(options.body).to.include('"Status":"FAILED"');
    expect(options.body).to.include("JAR_RSA_ENCRYPTION_KEY_ALIAS not sett");
  });

  it("tries to send failed response if success callback fails", async () => {
    const sendStub = sandbox.stub().resolves({});
    sandbox.stub(s3Client, "getClient").returns({ send: sendStub } as any);
    sandbox.stub(kmsService, "getPublicKey").resolves({
      PublicKey: createPublicKeyDer(),
    } as any);
    sandbox.stub(kmsService, "describeKey").resolves({
      KeyMetadata: { KeyId: "kms-key-id-1" },
    } as any);

    const fetchStub = sandbox.stub(globalThis, "fetch");
    fetchStub
      .onFirstCall()
      .resolves({ ok: false, statusText: "Bad Request" } as Response);
    fetchStub
      .onSecondCall()
      .resolves({ ok: true, statusText: "OK" } as Response);

    await handler(mockEvent("Create"), mockContext);

    expect(fetchStub).to.have.been.calledTwice;
    const [, secondCallOptions] = fetchStub.secondCall.args;
    expect(secondCallOptions.body).to.include('"Status":"FAILED"');
    expect(secondCallOptions.body).to.include(
      "Failed to send response: Bad Request"
    );
  });
});
