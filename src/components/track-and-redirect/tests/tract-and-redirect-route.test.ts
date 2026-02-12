import { describe, it, expect, vi, afterEach } from "vitest";
import express from "express";
import supertest from "supertest";
import * as eventServiceModule from "../../../services/event-service.js";
import { trackAndRedirectRouter } from "../track-and-redirect-route.js";
import * as trackAndRedirectController from "../track-and-redirect-controller.js";
import { PATH_DATA } from "../../../app.constants";
import { mockSessionMiddleware } from "../../../../test/utils/helpers";

describe("trackAndRedirectRouter", () => {
  let app: express.Express;
  let eventServiceStub: ReturnType<typeof vi.fn>;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should redirect to contact page if no session or session.queryParameters are available", async () => {
    app = express();
    app.use(trackAndRedirectRouter);

    // Stub out eventService
    const response = await supertest(app).get(PATH_DATA.TRACK_AND_REDIRECT.url);
    expect(response.redirect).toBe(true);
    expect(response.headers.location).toBe(PATH_DATA.CONTACT.url);
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
    eventServiceStub = vi.spyOn(eventServiceModule, "eventService");
    const fakeService = {
      buildAuditEvent: vi.fn().mockReturnValue({}),
      send: vi.fn(),
    };
    eventServiceStub.mockReturnValue(fakeService);
    const fakeEmailServiceUrl = new URL("http://fake-email-service.com");
    vi.spyOn(
      trackAndRedirectController,
      "buildContactEmailServiceUrl"
    ).mockReturnValue(fakeEmailServiceUrl);

    const response = await supertest(app).get(PATH_DATA.TRACK_AND_REDIRECT.url);

    expect(fakeService.buildAuditEvent).toHaveBeenCalledOnce();
    expect(fakeService.send).toHaveBeenCalledOnce();
    expect(response.redirect).toBe(true);
    expect(response.headers.location).toBe(fakeEmailServiceUrl.toString());
  });
});
