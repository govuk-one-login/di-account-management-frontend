import { Request, Response } from "express";
import { logger } from "../../utils/logger.js";
import { eventService } from "../../services/event-service.js";
import { AuditEvent } from "../../services/types.js";
import {
  getWebchatUrl,
  showContactEmergencyMessage,
  supportPhoneContact,
  supportWebchatContact,
  getAccessibilityStatementUrl,
} from "../../config.js";
import { setOplSettings } from "../../utils/opl.js";
import { EventName, PATH_DATA } from "../../app.constants.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

const CONTACT_ONE_LOGIN_TEMPLATE = "contact-govuk-one-login/index.njk";

export function contactGet(req: Request, res: Response): void {
  req.metrics?.addMetric("contactGet", MetricUnit.Count, 1);
  const service = eventService();
  const audit_event = service.buildAuditEvent(
    req,
    res,
    EventName.HOME_TRIAGE_PAGE_VISIT
  );
  logUserVisitsContactPage(audit_event, res.locals.trace);
  service.send(audit_event, res.locals.sessionId);
  render(req, res);
}

const logUserVisitsContactPage = (event: AuditEvent, trace: string) => {
  logger.info(
    {
      trace: trace,
      fromURL: event.extensions.from_url,
      referenceCode: event.extensions.reference_code,
      appSessionId: event.extensions.app_session_id,
      appErrorCode: event.extensions.app_error_code,
      sessionId: event.user.session_id,
      persistentSessionId: event.user.persistent_session_id,
      userAgent: event.platform.user_agent,
    },
    "User visited triage page"
  );
};

const render = (req: Request, res: Response): void => {
  const { language, protocol, hostname } = req;
  const baseUrl = protocol + "://" + hostname;
  const referenceCode = req.session.referenceCode;

  const data = {
    contactWebchatEnabled: supportWebchatContact(),
    contactPhoneEnabled: supportPhoneContact(),
    showContactEmergencyMessage: showContactEmergencyMessage(),
    referenceCode,
    contactEmailServiceUrl: PATH_DATA.TRACK_AND_REDIRECT.url,
    accessibilityStatementUrl: getAccessibilityStatementUrl(),
    webchatSource: getWebchatUrl(),
    baseUrl,
    language,
    nonce: res.locals.scriptNonce,
  };

  setOplSettings(
    {
      contentId: "dbd37b91-5d9e-419e-b6e4-1ea5b40a99f6",
      taxonomyLevel2: "contact gov uk",
    },
    res
  );
  res.render(CONTACT_ONE_LOGIN_TEMPLATE, data);
};
