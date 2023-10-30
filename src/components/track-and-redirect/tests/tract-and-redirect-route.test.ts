import express from "express";
import { expect } from "chai";
import { describe } from "mocha";
import supertest from "supertest";
import * as eventServiceModule from "../../../services/event-service";
import { trackAndRedirectRouter } from "../track-and-redirect-route";
import * as trackAndRedirectController from "../track-and-redirect-controller";
import { PATH_DATA } from "../../../app.constants";
import { sinon } from "../../../../test/utils/test-utils";

describe("trackAndRedirectRouter", () => {
  let app: express.Express;
  let eventServiceStub: sinon.SinonStub;

  beforeEach(() => {
    app = express();
    app.use(trackAndRedirectRouter);

    // Stub out eventService
    eventServiceStub = sinon.stub(eventServiceModule, "eventService");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should log an audit event and redirect to the email service URL", async () => {
    const fakeService = {
      buildAuditEvent: sinon.stub().returns({}),
      send: sinon.stub(),
    };
    eventServiceStub.returns(fakeService);
    const fakeEmailServiceUrl = new URL("http://fake-email-service.com");
    sinon
      .stub(trackAndRedirectController, "buildContactEmailServiceUrl")
      .returns(fakeEmailServiceUrl);

    const response = await supertest(app).get(PATH_DATA.TRACK_AND_REDIRECT.url);

    expect(fakeService.buildAuditEvent.calledOnce).to.be.true;
    expect(fakeService.send.calledOnce).to.be.true;
    expect(response.redirect).to.equal(true);
    expect(response.headers.location).to.equal(fakeEmailServiceUrl.toString());
  });
});
