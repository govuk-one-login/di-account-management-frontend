import { logger } from "./logger.js";
import { Request, Response } from "express";
import { LOG_MESSAGES } from "../app.constants.js";
import xss from "xss";

export const getSessionIdsFromGsCookie = (req: Request, res: Response) => {
  const cookie = req.cookies?.gs;
  if (!cookie) {
    logger.info(
      { trace: res.locals.trace },
      LOG_MESSAGES.GS_COOKIE_NOT_IN_REQUEST
    );
    return;
  }

  logger.info({ trace: res.locals.trace }, `gs cookie: ${cookie}`);
  const ids = xss(cookie).split(".");
  if (ids.length !== 2) {
    logger.error(
      { trace: res.locals.trace },
      LOG_MESSAGES.MALFORMED_GS_COOKIE(cookie)
    );
    return;
  }

  return {
    sessionId: ids[0],
    clientSessionId: ids[1],
  };
};

export const attachSessionIdsFromGsCookie = (req: Request, res: Response) => {
  const ids = getSessionIdsFromGsCookie(req, res);

  if (!ids) {
    return;
  }

  req.session.authSessionIds = ids;
};
