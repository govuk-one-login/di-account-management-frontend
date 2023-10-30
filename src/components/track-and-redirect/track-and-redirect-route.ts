import * as express from "express";
import { EVENT_NAME, PATH_DATA } from "../../app.constants";
import { buildAuditEvent } from "../contact-govuk-one-login/contact-govuk-one-login-controller";
import { eventService } from "../contact-govuk-one-login/event-service";
import { buildContactEmailServiceUrl } from "./track-and-redirect-controller";

const router = express.Router();
router.get(PATH_DATA.TRACK_AND_REDIRECT.url, (req, res) => {
  const emailServiceUrl = buildContactEmailServiceUrl(req);
  const audit_event = buildAuditEvent(
    req,
    res,
    EVENT_NAME.HOME_TRIAGE_PAGE_EMAIL
  );
  eventService().send(audit_event);
  res.redirect(emailServiceUrl.toString());
});

export { router as trackAndRedirectRouter };
