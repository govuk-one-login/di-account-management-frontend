import { Request, Response } from "express";
import { logger } from "../../utils/logger";
import { isSafeString, isValidUrl } from "./../../utils/strings";
import {
  getContactEmailServiceUrl,
  getWebchatUrl,
  showContactGuidance,
  supportPhoneContact,
  supportWebchatContact,
} from "../../config";
import { generateReferenceCode } from "./../../utils/referenceCode";
import { EventService } from "./event-service";
import { AuditEvent, EventServiceInterface, Extensions, Platform, User } from "./types";

const CONTACT_ONE_LOGIN_TEMPLATE = "contact-govuk-one-login/index.njk";

export function contactGet(req: Request, res: Response, ): void {
  logger.info(req.session, "The session contains:")
  updateSessionFromQueryParams(req.session, req.query);
  const audit_event = buildAuditEvent(req);
  logUserVisitsContactPage(audit_event);
  sendUserVisitsContactPageAuditEvent(audit_event);
  render(req, res);
}

const updateSessionFromQueryParams = (session: any, queryParams: any): void => {
  if (isValidUrl(queryParams.fromURL as string)) {
    session.fromURL = queryParams.fromURL;
  } else {
    logger.error("fromURL in request query for contact-govuk-one-login page did not pass validation");
  }

  copySafeQueryParamToSession(session, queryParams, 'theme');
  copySafeQueryParamToSession(session, queryParams, 'appSessionId');
  copySafeQueryParamToSession(session, queryParams, 'appErrorCode');

  if (!session.referenceCode) {
    session.referenceCode = generateReferenceCode();
  }
  logger.info("completed updating session");
}

const copySafeQueryParamToSession = (session: any, queryParams: any, paramName: string) => {
  if (queryParams[paramName] && isSafeString(queryParams[paramName] as string)) {
    session[paramName] = queryParams[paramName];
  } else {
    logger.error(`${paramName} in request query for contact-govuk-one-login page did not pass validation`);
  }
};

function buildAuditEvent(req: Request): AuditEvent {
  const user: User = {
    session_id: req.session.user?.sessionId,
    persistent_session_id: req.session.user?.persistentSessionId,
  };

  const platform: Platform = {
    user_agent: req.headers["user-agent"],
  };

  const extensions: Extensions = {
    from_url: req.session.fromURL,
    app_error_code: req.session.appErrorCode,
    app_session_id: req.session.appSessionId,
    reference_code: req.session.referenceCode,
  };

  return {
    timestamp: req.session.timestamp,
    event_name: "HOME_TRIAGE_PAGE_VISIT",
    component_id: "HOME",
    user: user,
    platform: platform,
    extensions: extensions,
  };
}

const buildContactEmailServiceUrl = (req: Request): URL => {
  const contactEmailServiceUrl: URL = new URL(getContactEmailServiceUrl());

  if (req.session.fromURL) {
    contactEmailServiceUrl.searchParams.append("fromURL", req.session.fromURL);
  } else {
    logger.info(
      "Request to contact-govuk-one-login page did not contain a valid fromURL in the request or session"
    );
  }

  if (req.session.theme) {
    contactEmailServiceUrl.searchParams.append("theme", req.session.theme);
  }

  if (req.session.appSessionId) {
    contactEmailServiceUrl.searchParams.append("appSessionId", req.session.appSessionId);
  }

  if (req.session.appErrorCode) {
    contactEmailServiceUrl.searchParams.append("appErrorCode", req.session.appErrorCode);
  }

  return contactEmailServiceUrl;
};

const logUserVisitsContactPage = (event: AuditEvent) => {
  logger.info(
    {
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

const sendUserVisitsContactPageAuditEvent = (audit_event: AuditEvent) => {
  const eventService: EventServiceInterface = EventService();
  eventService.send(audit_event);
};

const render = (req: Request, res: Response): void => {
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
    contactEmailServiceUrl: buildContactEmailServiceUrl(req).toString(),
    webchatSource: getWebchatUrl(),
  };

  res.render(CONTACT_ONE_LOGIN_TEMPLATE, data);
};

