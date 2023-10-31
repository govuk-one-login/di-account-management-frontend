import { Request, Response } from "express";
import {
  EventServiceInterface,
  EventNameType,
  AuditEvent,
  Event,
} from "./types";
import { SqsService } from "../utils/types";
import { sqsService } from "../utils/sqs";
import { MISSING_SESSION_VALUE_SPECIAL_CASE } from "../app.constants";
import { Session } from "express-session";

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
      : MISSING_SESSION_VALUE_SPECIAL_CASE;

  const getPersistentSessionId = (res: Response): string =>
    res.locals.persistentSessionId || MISSING_SESSION_VALUE_SPECIAL_CASE;

  const getAppSessionId = (session: Session): string =>
    userHasComeFromTheApp(session)
      ? session.queryParameters?.appSessionId
      : MISSING_SESSION_VALUE_SPECIAL_CASE;

  const buildAuditEvent = (
    req: Request,
    res: Response,
    eventName: EventNameType
  ): AuditEvent => {
    const { headers, session } = req;

    return {
      timestamp: Date.now(),
      event_name: eventName,
      component_id: "HOME",
      user: {
        session_id: getSessionId(res),
        persistent_session_id: getPersistentSessionId(res),
      },
      platform: {
        user_agent: headers["user-agent"],
      },
      extensions: {
        from_url: session.queryParameters?.fromURL,
        app_error_code: session.queryParameters?.appErrorCode,
        app_session_id: getAppSessionId(session),
        reference_code: session.referenceCode,
      },
    };
  };

  const send = (event: Event): void => {
    sqs.send(JSON.stringify(event));
  };

  return { buildAuditEvent, send };
}
