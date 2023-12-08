import pino from "pino";
import PinoHttp from "pino-http";
import { getLogLevel } from "../config";
import { getSessionIdsFrom } from "./session-ids";

const logger = pino({
  name: "di-account-management-frontend",
  level: getLogLevel(),
  serializers: {
    req: (req) => {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        from: getRefererFrom(req.headers.referer),
        trace: getSessionIdsFrom(req).sessionId,
      };
    },
    res: (res) => {
      return {
        status: res.statusCode,
        sessionId: res.locals.sessionId,
        clientSessionId: res.locals.clientSessionId,
        persistentSessionId: res.locals.persistentSessionId,
        trace: res.locals.sessionId,
      };
    },
  },
});

export function getRefererFrom(referer: string): string {
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return refererUrl.pathname + refererUrl.search;
    } catch (error) {
      return undefined;
    }
  } else {
    return undefined;
  }
}

const loggerMiddleware = PinoHttp({
  logger,
  wrapSerializers: false,
  autoLogging: {
    ignorePaths: [
      "/public/scripts/cookies.js",
      "/public/scripts/all.js",
      "/public/style.css",
      "/public/style.css.map",
      "/public/scripts/application.js",
      "/assets/images/govuk-crest-2x.png",
      "/assets/fonts/bold-b542beb274-v2.woff2",
      "/assets/fonts/bold-b542beb274-v2.woff2",
      "/assets/images/favicon.ico",
      "/assets/fonts/light-94a07e06a1-v2.woff2",
    ],
  },
  customErrorMessage: function (error, res) {
    return "request errored with status code: " + res.statusCode;
  },
  customSuccessMessage: function (res) {
    if (res.statusCode === 404) {
      return "resource not found";
    }
    return `request completed with status code:${res.statusCode}`;
  },
  customAttributeKeys: {
    responseTime: "timeTaken",
  },
});

export { logger, loggerMiddleware };
