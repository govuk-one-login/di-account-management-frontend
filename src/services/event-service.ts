import { Request, Response } from "express";
import {
  EventServiceInterface,
  AuditEvent,
  Event,
  CurrentTimeDescriptor,
} from "./types.js";
import { SqsService } from "../utils/types.js";
import { sqsService } from "../utils/sqs.js";
import {
  EventName,
  MISSING_APP_SESSION_ID_SPECIAL_CASE,
  MISSING_PERSISTENT_SESSION_ID_SPECIAL_CASE,
  MISSING_SESSION_ID_SPECIAL_CASE,
  MISSING_USER_EMAIL_SPECIAL_CASE,
  MISSING_USER_ID_SPECIAL_CASE,
} from "../app.constants.js";
import { Session } from "express-session";
import { getTxmaHeader } from "../utils/txma-header.js";
import { getOIDCClientId } from "../config.js";
import { mfaMethodTypes } from "../utils/mfaClient/types.js";
import { parsePhoneNumber } from "libphonenumber-js/mobile";

/**
 * A function for calculating and returning an object containing the current timestamp.
 *
 * @returns CurrentTimeDescriptor object, containing different formats of the current time
 */
function getCurrentTimestamp(date = new Date()): CurrentTimeDescriptor {
  return {
    milliseconds: date.valueOf(),
    isoString: date.toISOString(),
    seconds: Math.floor(date.valueOf() / 1000),
  };
}

export function eventService(
  sqs: SqsService = sqsService()
): EventServiceInterface {
  const userHasSignedIntoHomeRelyingParty = (res: Response): boolean =>
    !!res.locals?.sessionId;

  const userHasComeFromTheApp = (session: Session): boolean =>
    !!session.queryParameters?.appSessionId;

  const getSessionId = (res: Response): string =>
    userHasSignedIntoHomeRelyingParty(res)
      ? res.locals.sessionId
      : MISSING_SESSION_ID_SPECIAL_CASE;

  const getPersistentSessionId = (res: Response): string =>
    res.locals.persistentSessionId ??
    MISSING_PERSISTENT_SESSION_ID_SPECIAL_CASE;

  const getUserId = (session: Session): string =>
    session.user_id ?? MISSING_USER_ID_SPECIAL_CASE;

  const getUserEmail = (session: Session): string =>
    session.user?.email ?? MISSING_USER_EMAIL_SPECIAL_CASE;

  const getAppSessionId = (session: Session): string =>
    userHasComeFromTheApp(session)
      ? session.queryParameters?.appSessionId
      : MISSING_APP_SESSION_ID_SPECIAL_CASE;

  const isSignedIn = (session: Session): boolean =>
    session.user?.isAuthenticated ?? false;

  const buildBaseAuditEvent = (
    req: Request,
    res: Response,
    eventName: EventName
  ): AuditEvent => {
    const { headers, session } = req;

    const timestamps = getCurrentTimestamp();
    const txmaHeader = getTxmaHeader(req, res.locals.trace);
    return {
      timestamp: timestamps.seconds,
      event_timestamp_ms: timestamps.milliseconds,
      event_timestamp_ms_formatted: timestamps.isoString,
      event_name: eventName,
      component_id: "HOME",
      client_id: getOIDCClientId(),
      user: {
        session_id: getSessionId(res),
        persistent_session_id: getPersistentSessionId(res),
        user_id: getUserId(session),
        ip_address: req.ip,
        email: getUserEmail(session),
        govuk_signin_journey_id: res.locals.clientSessionId,
      },
      platform: {
        user_agent: headers["user-agent"],
      },
      ...(txmaHeader === undefined
        ? {}
        : {
            restricted: {
              device_information: {
                encoded: txmaHeader,
              },
            },
          }),
    };
  };

  const buildAuditEvent = (
    req: Request,
    res: Response,
    eventName: EventName
  ): AuditEvent => {
    const baseEvent = buildBaseAuditEvent(req, res, eventName);

    const { session } = req;
    const defaultMethod = session.mfaMethods?.find(
      (method) => method.priorityIdentifier === "DEFAULT"
    );

    const backupMethod = session.mfaMethods?.find(
      (method) => method.priorityIdentifier === "BACKUP"
    );

    const defaultPhoneNumberCountryCodeObject =
      defaultMethod?.method.mfaMethodType === mfaMethodTypes.sms
        ? {
            phone_number_country_code: parsePhoneNumber(
              defaultMethod.method.phoneNumber,
              "GB"
            ).countryCallingCode,
          }
        : {};

    const defaultPhoneNumberObject =
      defaultMethod?.method.mfaMethodType === mfaMethodTypes.sms
        ? {
            phone: defaultMethod.method.phoneNumber,
          }
        : {};

    const backupPhoneNumberCountryCodeObject =
      backupMethod?.method.mfaMethodType === mfaMethodTypes.sms
        ? {
            phone_number_country_code: parsePhoneNumber(
              backupMethod.method.phoneNumber,
              "GB"
            ).countryCallingCode,
          }
        : {};

    const backupPhoneNumberObject =
      backupMethod?.method.mfaMethodType === mfaMethodTypes.sms
        ? {
            phone: backupMethod.method.phoneNumber,
          }
        : {};

    switch (eventName) {
      case EventName.HOME_TRIAGE_PAGE_VISIT:
      case EventName.HOME_TRIAGE_PAGE_EMAIL:
        baseEvent.extensions = {
          from_url: session.queryParameters?.fromURL,
          app_error_code: session.queryParameters?.appErrorCode,
          app_session_id: getAppSessionId(session),
          reference_code: session.referenceCode,
          is_signed_in: isSignedIn(session),
        };
        break;

      case EventName.AUTH_MFA_METHOD_ADD_STARTED:
        baseEvent.user = {
          ...baseEvent.user,
          ...defaultPhoneNumberObject,
        };
        baseEvent.extensions = {
          "journey-type": "ACCOUNT_MANAGEMENT",
          ...defaultPhoneNumberCountryCodeObject,
        };
        break;

      case EventName.AUTH_MFA_METHOD_SWITCH_STARTED:
        baseEvent.user = {
          ...baseEvent.user,
          ...defaultPhoneNumberObject,
        };
        baseEvent.extensions = {
          "journey-type": "ACCOUNT_MANAGEMENT",
          "mfa-type": defaultMethod.method.mfaMethodType,
          ...defaultPhoneNumberCountryCodeObject,
        };
        break;

      case EventName.AUTH_MFA_METHOD_DELETE_STARTED:
        baseEvent.user = {
          ...baseEvent.user,
          ...backupPhoneNumberObject,
        };
        baseEvent.extensions = {
          "journey-type": "ACCOUNT_MANAGEMENT",
          "mfa-type": backupMethod.method.mfaMethodType,
          ...backupPhoneNumberCountryCodeObject,
        };
        break;

      case EventName.HOME_GLOBAL_LOGOUT_REQUESTED:
        break;

      default: {
        throw new Error(`Unknown event name: ${eventName}`);
      }
    }

    return baseEvent;
  };

  const send = (event: Event, trace: string): void => {
    void sqs.sendAuditEvent(JSON.stringify(event), trace);
  };

  return { buildAuditEvent, send };
}
