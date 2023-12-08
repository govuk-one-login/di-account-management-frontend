import { Request } from "express";
import xss from "xss";
import {
  CLIENT_SESSION_ID_UNKNOWN,
  PERSISTENT_SESSION_ID_UNKNOWN,
  SESSION_ID_UNKNOWN,
  LOG_MESSAGES,
} from "../app.constants";
import { logger } from "./logger";

interface SessionIds {
  sessionId: string;
  clientSessionId: string;
  persistentSessionId: string;
}

export function getSessionIdsFrom(req: Request): SessionIds {
  const sessionIds: Partial<SessionIds> = {};

  if (req?.cookies?.gs) {
    const ids = xss(req.cookies["gs"]).split(".");
    if (ids.length != 2) {
      logger.error(LOG_MESSAGES.MALFORMED_GS_COOKIE(req.cookies["gs"]));
      sessionIds.sessionId = SESSION_ID_UNKNOWN;
      sessionIds.clientSessionId = CLIENT_SESSION_ID_UNKNOWN;
    } else {
      sessionIds.sessionId = ids[0];
      sessionIds.clientSessionId = ids[1];
    }
  } else {
    logger.info(LOG_MESSAGES.GS_COOKIE_NOT_IN_REQUEST);
    sessionIds.sessionId = SESSION_ID_UNKNOWN;
    sessionIds.clientSessionId = CLIENT_SESSION_ID_UNKNOWN;
  }

  if (req?.cookies?.["di-persistent-session-id"]) {
    sessionIds.persistentSessionId = xss(
      req.cookies["di-persistent-session-id"]
    );
  } else {
    logger.info(
      { trace: sessionIds.sessionId },
      LOG_MESSAGES.DI_PERSISTENT_SESSION_ID_COOKIE_NOT_IN_REQUEST
    );
    sessionIds.persistentSessionId = PERSISTENT_SESSION_ID_UNKNOWN;
  }

  return {
    sessionId: sessionIds.sessionId,
    clientSessionId: sessionIds.clientSessionId,
    persistentSessionId: sessionIds.persistentSessionId,
  };
}
