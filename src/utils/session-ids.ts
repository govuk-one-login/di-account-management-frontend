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
  const sessionId = req.session.authSessionIds?.sessionId ?? SESSION_ID_UNKNOWN;
  const clientSessionId =
    req.session.authSessionIds?.clientSessionId ?? CLIENT_SESSION_ID_UNKNOWN;
  let persistentSessionId = PERSISTENT_SESSION_ID_UNKNOWN;

  if (req?.cookies?.["di-persistent-session-id"]) {
    persistentSessionId = xss(req.cookies["di-persistent-session-id"]);
    logger.info(
      {
        trace: persistentSessionId + "::" + sessionId,
      },
      `DI persistent session id cookie: ${req.cookies["di-persistent-session-id"]}`
    );
  } else {
    logger.info(
      {
        trace: PERSISTENT_SESSION_ID_UNKNOWN + "::" + sessionId,
      },
      LOG_MESSAGES.DI_PERSISTENT_SESSION_ID_COOKIE_NOT_IN_REQUEST
    );
  }

  return {
    sessionId,
    clientSessionId,
    persistentSessionId,
  };
}
