import { Request, Response } from "express";
import {
  EventServiceInterface,
  AuditEvent,
  Event,
  CurrentTimeDescriptor,
} from "./types";
import { SqsService } from "../utils/types";
import { sqsService } from "../utils/sqs";
import {
  EventName,
  MISSING_APP_SESSION_ID_SPECIAL_CASE,
  MISSING_PERSISTENT_SESSION_ID_SPECIAL_CASE,
  MISSING_SESSION_ID_SPECIAL_CASE,
  MISSING_USER_ID_SPECIAL_CASE,
} from "../app.constants";
import { Session } from "express-session";
import { getTxmaHeader } from "../utils/txma-header";

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

  const getAppSessionId = (session: Session): string =>
    userHasComeFromTheApp(session)
      ? session.queryParameters?.appSessionId
      : MISSING_APP_SESSION_ID_SPECIAL_CASE;

  const isSignedIn = (session: Session): boolean =>
    session.user?.isAuthenticated ?? false;

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
      user: {
        session_id: getSessionId(res),
        persistent_session_id: getPersistentSessionId(res),
        user_id: getUserId(session),
      },
      platform: {
        user_agent: headers["user-agent"],
      },
      ...(txmaHeader !== undefined
        ? {
            restricted: {
              device_information: {
                encoded: txmaHeader,
              },
            },
          }
        : {}),
    };
  };

  const buildAuditEvent = (
    req: Request,
    res: Response,
    eventName: EventName
  ): AuditEvent => {
    const baseEvent = buildBaseAuditEvent(req, res, eventName);

    const { session } = req;

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
        baseEvent.extensions = {
          "journey-type": "ACCOUNT_MANAGEMENT",
        };
        break;

      default: {
        throw new Error(`Unknown event name: ${eventName}`);
      }
    }

    return baseEvent;
  };

  const send = (event: Event, trace: string): void => {
    sqs.send(JSON.stringify(event), trace);
  };

  return { buildAuditEvent, send };
}
