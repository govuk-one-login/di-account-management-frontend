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

  if (req?.cookies) {
    logger.info(`Cookies: ${Object.keys(req.cookies)}`);
    if (req.cookies["di-persistent-session-id"]) {
      logger.info(`Cookies: ${req.cookies["di-persistent-session-id"]}`);
    }
  }

  if (req?.cookies?.["di-persistent-session-id"]) {
    sessionIds.persistentSessionId = xss(
      req.cookies["di-persistent-session-id"]
    );
  } else {
    logger.info(
      {
        trace: PERSISTENT_SESSION_ID_UNKNOWN + "::" + sessionIds.sessionId,
      },
      LOG_MESSAGES.DI_PERSISTENT_SESSION_ID_COOKIE_NOT_IN_REQUEST
    );
    sessionIds.persistentSessionId = PERSISTENT_SESSION_ID_UNKNOWN;
  }

  return {
    sessionId: req.session.authSessionIds?.sessionId ?? SESSION_ID_UNKNOWN,
    clientSessionId:
      req.session.authSessionIds?.clientSessionId ?? CLIENT_SESSION_ID_UNKNOWN,
    persistentSessionId: sessionIds.persistentSessionId,
  };
}
