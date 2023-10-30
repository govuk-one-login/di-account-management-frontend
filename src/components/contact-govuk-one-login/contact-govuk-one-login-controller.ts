import { Request, Response } from "express";
import { logger } from "../../utils/logger";
import { isSafeString, isValidUrl } from "../../utils/strings";
import {
  getWebchatUrl,
  showContactGuidance,
  supportPhoneContact,
  supportWebchatContact,
} from "../../config";
import { generateReferenceCode } from "../../utils/referenceCode";
import { eventService } from "./event-service";
import { AuditEvent, Extensions, Platform, User } from "./types";
import { EVENT_NAME, ParamName, PATH_DATA } from "../../app.constants";
import { Session } from "express-session";

const CONTACT_ONE_LOGIN_TEMPLATE = "contact-govuk-one-login/index.njk";
const MISSING_SESSION_VALUE_SPECIAL_CASE: string = "";

export function contactGet(req: Request, res: Response): void {
  updateSessionFromQueryParams(req.session, req.query);
  const audit_event = buildAuditEvent(
    req,
    res,
    EVENT_NAME.HOME_TRIAGE_PAGE_VISIT
  );
  logUserVisitsContactPage(audit_event);
  sendUserVisitsContactPageAuditEvent(audit_event);
  render(req, res);
}

const updateSessionFromQueryParams = (
  session: Session,
  queryParams: any
): void => {
  if (isValidUrl(queryParams.fromURL)) {
    session.queryParameters = {
      fromURL: queryParams.fromURL,
    };
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
  session: Session,
  queryParams: any,
  paramName: ParamName
) => {
  if (
    queryParams[paramName] &&
    isSafeString(queryParams[paramName] as string)
  ) {
    session.queryParameters[paramName] = queryParams[paramName];
  } else {
    logger.error(
      `${paramName} in request query for contact-govuk-one-login page did not pass validation`
    );
  }
};
type EventNameType = typeof EVENT_NAME[keyof typeof EVENT_NAME];

export const buildAuditEvent = (
  req: Request,
  res: Response,
  eventName: EventNameType
): AuditEvent => {
  const session = req.session;
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
    appSessionId = req.session.queryParameters?.appSessionId;
  } else {
    appSessionId = MISSING_SESSION_VALUE_SPECIAL_CASE;
  }

  const extensions: Extensions = {
    from_url: req.session.queryParameters?.fromURL,
    app_error_code: req.session.queryParameters?.appErrorCode,
    app_session_id: appSessionId,
    reference_code: req.session.referenceCode,
  };

  return {
    timestamp: req.session.timestamp,
    event_name: eventName,
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
  return !!session.queryParameters?.appSessionId;
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
    contactEmailServiceUrl: PATH_DATA.TRACK_AND_REDIRECT.url,
    webchatSource: getWebchatUrl(),
    currentUrl: originalUrl,
    baseUrl,
    language,
  };

  res.render(CONTACT_ONE_LOGIN_TEMPLATE, data);
};
