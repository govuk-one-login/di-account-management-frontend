import { describe } from "mocha";
import { sinon } from "../../../test/utils/test-utils";
import { SqsService } from "../types";
import { EventService } from "../../components/contact-govuk-one-login/event-service";
import { AuditEvent } from "../../components/contact-govuk-one-login/types";
import { expect } from "chai";
// import { SQSClient } from "@aws-sdk/client-sqs";
// import { sqsService } from "../../utils/sqs";

describe("SQS service tests", () : void => {

  let sandbox: sinon.SinonSandbox;

  beforeEach((): void => {
    sandbox = sinon.createSandbox();
  });

  it("can send a message to an SQS queue", (): void => {
    const fakeSqsService: SqsService = {send: sandbox.fake()};

    const expectedEvent : AuditEvent = {
      timestamp: undefined,
      event_name: "HOME_TRIAGE_PAGE_VISIT",
      component_id: "HOME",
      user: undefined,
      platform: undefined,
      extensions: undefined,
    }

    EventService(fakeSqsService).send(expectedEvent);

    expect(fakeSqsService.send).to.have.been.calledOnceWith(JSON.stringify(expectedEvent));
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