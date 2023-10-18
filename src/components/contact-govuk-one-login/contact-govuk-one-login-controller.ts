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
  updateSessionFromQueryParams(req.session, req.query);
  logContactDataFromSession(req);
  sendUserVisitsContactPageAuditEvent(req);
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
}

const copySafeQueryParamToSession = (session: any, queryParams: any, paramName: string) => {
  if (queryParams[paramName] && isSafeString(queryParams[paramName] as string)) {
    session[paramName] = queryParams[paramName];
  } else {
    logger.error(`${paramName} in request query for contact-govuk-one-login page did not pass validation`);
  }
};

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

const logContactDataFromSession = (req: Request) => {
  logger.info(
    {
      fromURL: req.session.fromURL,
      referenceCode: req.session.referenceCode,
      appSessionId: req.session.appSessionId,
      appErrorCode: req.session.appErrorCode,
      sessionId: req.session.user?.sessionId,
      persistentSessionId: req.session.user?.persistentSessionId,
      userAgent: req.headers["user-agent"],
    },
    "User visited triage page"
  );
};

const sendUserVisitsContactPageAuditEvent = (req: Request) => {
  const eventService: EventServiceInterface = EventService();

  const user: User = {
    session_id: req.session.user?.sessionId,
    persistent_session_id: req.session.user?.persistentSessionId,
  };

  const platform: Platform = {
    user_agent: req.session.userAgent,
  };

  const extensions: Extensions = {
    from_url: req.session.fromURL,
    app_error_code: req.session.appErrorCode,
    app_session_id: req.session.appSessionId,
    reference_code: req.session.referenceCode,
  };

  const audit_event: AuditEvent = {
    timestamp: req.session.timestamp,
    event_name: "HOME_TRIAGE_PAGE_VISIT",
    component_id: "HOME",
    user: user,
    platform: platform,
    extensions: extensions,
  };

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

