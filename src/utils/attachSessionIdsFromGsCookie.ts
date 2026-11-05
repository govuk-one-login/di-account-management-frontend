import { logger } from "./logger.js";
import { Request } from "express";
import { LOG_MESSAGES } from "../app.constants.js";
import xss from "xss";

export function attachSessionIdsFromGsCookie(req: Request) {
  const cookie = req.cookies?.gs;
  if (!cookie) {
    logger.info(LOG_MESSAGES.GS_COOKIE_NOT_IN_REQUEST);
    return;
  }

  logger.info(`gs cookie: ${cookie}`);
  const ids = xss(cookie).split(".");
  if (ids.length !== 2) {
    logger.error(LOG_MESSAGES.MALFORMED_GS_COOKIE(cookie));
  } else {
    req.session.authSessionIds = {
      sessionId: ids[0],
      clientSessionId: ids[1],
    };
  }
}
