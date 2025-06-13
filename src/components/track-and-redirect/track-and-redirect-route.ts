import * as express from "express";
import { EventName, PATH_DATA } from "../../app.constants";

import { eventService } from "../../services/event-service";
import { buildContactEmailServiceUrl } from "./track-and-redirect-controller";
import { logger } from "../../utils/logger";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

const router = express.Router();
router.get(PATH_DATA.TRACK_AND_REDIRECT.url, (req, res) => {
  req.metrics?.addMetric("trackAndRedirectGet", MetricUnit.Count, 1);
  if (!req.session || !req.session.queryParameters) {
    logger.error(
      "Track and redirect route: request session or queryParameters are undefined."
    );
    return res.redirect(PATH_DATA.CONTACT.url);
  }
  const emailServiceUrl = buildContactEmailServiceUrl(req, res);
  const service = eventService();
  const audit_event = service.buildAuditEvent(
    req,
    res,
    EventName.HOME_TRIAGE_PAGE_EMAIL
  );
  const trace = res.locals.sessionId;
  service.send(audit_event, trace);
  res.redirect(emailServiceUrl.toString());
});

export { router as trackAndRedirectRouter };
