import { Request, Response } from "express";
import { logger } from "../../utils/logger";
import { eventService } from "../../services/event-service";
import { AuditEvent } from "../../services/types";
import {
  getWebchatUrl,
  showContactGuidance,
  supportPhoneContact,
  supportWebchatContact,
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
  logUserVisitsContactPage(audit_event);
  service.send(audit_event, res.locals.sessionId);
  render(req, res);
}

const logUserVisitsContactPage = (event: AuditEvent) => {
  logger.info(
    {
      trace: event.user.session_id,
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
  const { originalUrl, language, protocol, hostname } = req;
  const baseUrl = protocol + "://" + hostname;
  const isAuthenticated = req.session.user?.isAuthenticated;
  let isLoggedOut = req.cookies?.lo;
  if (typeof isLoggedOut === "string") {
    isLoggedOut = JSON.parse(isLoggedOut);
  }
  const referenceCode = req.session.referenceCode;

  const data = {
    contactWebchatEnabled: supportWebchatContact(),
    contactPhoneEnabled: supportPhoneContact(),
    showContactGuidance: showContactGuidance(),
    showSignOut: isAuthenticated && !isLoggedOut,
    referenceCode,
    contactEmailServiceUrl: PATH_DATA.TRACK_AND_REDIRECT.url,
    webchatSource: getWebchatUrl(),
    currentUrl: originalUrl,
    baseUrl,
    language,
    nonce: res.locals.scriptNonce,
  };

  res.render(CONTACT_ONE_LOGIN_TEMPLATE, data);
};
