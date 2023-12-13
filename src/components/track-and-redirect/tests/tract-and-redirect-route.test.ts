import express from "express";
import { expect } from "chai";
import { describe } from "mocha";
import supertest from "supertest";
import * as eventServiceModule from "../../../services/event-service";
import { trackAndRedirectRouter } from "../track-and-redirect-route";
import * as trackAndRedirectController from "../track-and-redirect-controller";
import { PATH_DATA } from "../../../app.constants";
import { sinon } from "../../../../test/utils/test-utils";
import { mockSessionMiddleware } from "../../../../test/utils/helpers";

describe("trackAndRedirectRouter", () => {
  let app: express.Express;
  let eventServiceStub: sinon.SinonStub;

  afterEach(() => {
    sinon.restore();
  });

  it("should redirect to contact page if no session or session.queryParameters are available", async () => {
    app = express();
    app.use(trackAndRedirectRouter);

    // Stub out eventService
    const response = await supertest(app).get(PATH_DATA.TRACK_AND_REDIRECT.url);
    expect(response.redirect).to.equal(true);
    expect(response.headers.location).to.equal(PATH_DATA.CONTACT.url);
  });

  it("should log an audit event and redirect to the email service URL", async () => {
    app = express();
    app.use(
      mockSessionMiddleware({
        queryParameters: {
          fromURL: "https://home.dev.gov.uk",
        },
      })
    );
    app.use(trackAndRedirectRouter);

    // Stub out eventService
    eventServiceStub = sinon.stub(eventServiceModule, "eventService");
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
