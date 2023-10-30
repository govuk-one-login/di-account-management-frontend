import { Request, Response } from "express";
import { logger } from "../../utils/logger";
import { isSafeString, isValidUrl } from "../../utils/strings";
import {
  getContactEmailServiceUrl,
  getWebchatUrl,
  showContactGuidance,
  supportPhoneContact,
  supportWebchatContact,
} from "../../config";
import { generateReferenceCode } from "../../utils/referenceCode";
import { eventService } from "./event-service";
import { AuditEvent, Extensions, Platform, User } from "./types";

const CONTACT_ONE_LOGIN_TEMPLATE = "contact-govuk-one-login/index.njk";
const MISSING_SESSION_VALUE_SPECIAL_CASE: string = "";

export function contactGet(req: Request, res: Response): void {
  updateSessionFromQueryParams(req.session, req.query);
  const audit_event = buildAuditEvent(req, res);
  logUserVisitsContactPage(audit_event);
  sendUserVisitsContactPageAuditEvent(audit_event);
  render(req, res);
}

const updateSessionFromQueryParams = (session: any, queryParams: any): void => {
  if (isValidUrl(queryParams.fromURL as string)) {
    session.fromURL = queryParams.fromURL;
  } else {
    logger.error(
      "fromURL in request query for contact-govuk-one-login page did not pass validation"
    );
  }

  copySafeQueryParamToSession(session, queryParams, "theme");
  copySafeQueryParamToSession(session, queryParams, "appSessionId");
  copySafeQueryParamToSession(session, queryParams, "appErrorCode");

  if (!session.referenceCode) {
    session.referenceCode = generateReferenceCode();
  }
};

const copySafeQueryParamToSession = (
  session: any,
  queryParams: any,
  paramName: string
) => {
  if (
    queryParams[paramName] &&
    isSafeString(queryParams[paramName] as string)
  ) {
    session[paramName] = queryParams[paramName];
  } else {
    logger.error(
      `${paramName} in request query for contact-govuk-one-login page did not pass validation`
    );
  }
};

const buildAuditEvent = (req: Request, res: Response): AuditEvent => {
  const session: any = req.session;
  let sessionId: string;

  if (userHasSignedIntoHomeRelyingParty(res)) {
    sessionId = res.locals.sessionId;
  } else {
    sessionId = MISSING_SESSION_VALUE_SPECIAL_CASE;
  }

  let persistentSessionId: string;

  if (res.locals.persistentSessionId) {
    persistentSessionId = res.locals.persistentSessionId;
  } else {
    persistentSessionId = MISSING_SESSION_VALUE_SPECIAL_CASE;
  }

  const user: User = {
    session_id: sessionId,
    persistent_session_id: persistentSessionId,
  };

  const platform: Platform = {
    user_agent: req.headers["user-agent"],
  };

  let appSessionId: string;

  if (userHasComeFromTheApp(session)) {
    appSessionId = req.session.appSessionId;
  } else {
    appSessionId = MISSING_SESSION_VALUE_SPECIAL_CASE;
  }

  const extensions: Extensions = {
    from_url: req.session.fromURL,
    app_error_code: req.session.appErrorCode,
    app_session_id: appSessionId,
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
};

const userHasSignedIntoHomeRelyingParty = (res: Response): boolean => {
  return !!res.locals?.sessionId;
};

const userHasComeFromTheApp = (session: any): boolean => {
  return !!session.appSessionId;
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
    contactEmailServiceUrl.searchParams.append(
      "appSessionId",
      req.session.appSessionId
    );
  }

  if (req.session.appErrorCode) {
    contactEmailServiceUrl.searchParams.append(
      "appErrorCode",
      req.session.appErrorCode
    );
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
  eventService().send(audit_event);
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
    contactEmailServiceUrl: buildContactEmailServiceUrl(req).toString(),
    webchatSource: getWebchatUrl(),
    currentUrl: originalUrl,
    baseUrl,
    language,
  };

  res.render(CONTACT_ONE_LOGIN_TEMPLATE, data);
};
