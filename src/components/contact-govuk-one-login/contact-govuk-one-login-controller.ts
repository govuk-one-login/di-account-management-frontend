import { Request, Response } from "express";
import { logger } from "../../utils/logger";
import { eventService } from "../../services/event-service";
import { AuditEvent } from "../../services/types";
import {
  getWebchatUrl,
  showContactGuidance,
  showContactEmergencyMessage,
  supportPhoneContact,
  supportWebchatContact,
  getAccessibilityStatementUrl,
} from "../../config";
import { EVENT_NAME, PATH_DATA } from "../../app.constants";

const CONTACT_ONE_LOGIN_TEMPLATE = "contact-govuk-one-login/index.njk";

export function contactGet(req: Request, res: Response): void {
  const service = eventService();
  const audit_event = service.buildAuditEvent(
    req,
    res,
    EVENT_NAME.HOME_TRIAGE_PAGE_VISIT
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
    showContactGuidance: showContactGuidance(),
    showContactEmergencyMessage: showContactEmergencyMessage(),
    referenceCode,
    contactEmailServiceUrl: PATH_DATA.TRACK_AND_REDIRECT.url,
    accessibilityStatementUrl: getAccessibilityStatementUrl(),
    webchatSource: getWebchatUrl(),
    baseUrl,
    language,
    nonce: res.locals.scriptNonce,
  };

  res.render(CONTACT_ONE_LOGIN_TEMPLATE, data);
};
