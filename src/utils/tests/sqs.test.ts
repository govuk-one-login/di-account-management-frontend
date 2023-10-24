import { describe } from "mocha";
import { sinon } from "../../../test/utils/test-utils";
import { AuditEvent } from "../../components/contact-govuk-one-login/types";
import { expect } from "chai";
import * as SQS from "@aws-sdk/client-sqs";
import { sqsService } from "../../utils/sqs";

describe("SQS service tests", (): void => {
  let sandbox: sinon.SinonSandbox;
  let mockSQSClient: SQS.SQSClient;

  beforeEach((): void => {
    sandbox = sinon.createSandbox();

    const mockSQSClient = {
      send: sandbox.fake(),
      config: sandbox.fake(),
      destroy: sandbox.fake(),
      middlewareStack: sandbox.fake(),
    };

    sandbox.stub(SQS, "SQSClient").callsFake(() => {
      return mockSQSClient;
    });
  });

  afterEach((): void => {
    sandbox.restore();
  });

  it("can send a message to an SQS queue", (): void => {
    const expectedEvent: AuditEvent = {
      timestamp: undefined,
      event_name: "HOME_TRIAGE_PAGE_VISIT",
      component_id: "HOME",
      user: undefined,
      platform: undefined,
      extensions: undefined,
    };

    sqsService().send(JSON.stringify(expectedEvent));

    expect(mockSQSClient.send).to.have.been.calledOnceWith(
      JSON.stringify(expectedEvent)
    );
  });

  it("sends a failed message to the DLQ", (): void => {
    // const eventService: EventServiceInterface = EventService();
    // const stub = sinon.stub(eventService);
    // stub.send.onFirstCall().throwsException()
    // const fakeSqsClient: SQSClient = {send: sandbox.stub().onFirstCall().throws(new Error("AWS error"))}
    //
    // const sut: SqsService = sqsService();
    //
    //
    // const expectedEvent : AuditEvent = {
    //   timestamp: undefined,
    //   event_name: "HOME_TRIAGE_PAGE_VISIT",
    //   component_id: "HOME",
    //   user: undefined,
    //   platform: undefined,
    //   extensions: undefined,
    // }
  });
});
