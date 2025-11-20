import pino from "pino";
import PinoHttp from "pino-http";
import { getLogLevel } from "../config";

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
      };
    },
    res: (res) => {
      return {
        status: res.statusCode,
        sessionId: res.locals.sessionId,
        clientSessionId: res.locals.clientSessionId,
        persistentSessionId: res.locals.persistentSessionId,
        trace: res.locals.trace,
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
      // eslint-disable-next-line no-console
      console.error(`Logger: Error obtaining referer URL ${error}`);
      return undefined;
    }
  } else {
    return undefined;
  }
}

const ignorePaths = [
  "/public/scripts/cookies.js",
  "/public/scripts/all.js",
  "/public/style.css",
  "/public/style.css.map",
  "/assets/images/govuk-crest-2x.png",
  "/assets/fonts/bold-b542beb274-v2.woff2",
  "/assets/fonts/bold-b542beb274-v2.woff2",
  "/assets/images/favicon.ico",
  "/assets/fonts/light-94a07e06a1-v2.woff2",
  "/healthcheck",
];

const loggerHttp = logger as pino.Logger<string>;

const loggerMiddleware = PinoHttp({
  logger: loggerHttp,
  wrapSerializers: false,
  autoLogging: { ignore: (req) => ignorePaths.includes(req.url) },
  customErrorMessage: function (error, res) {
    return "request errored with status code: " + res.statusCode;
  },
  customSuccessMessage: function (res) {
    if (res.statusCode === 404) {
      return "resource not found";
    }
    return `request completed with status code: ${res.statusCode}`;
  },
  customAttributeKeys: {
    responseTime: "timeTaken",
  },
});

export { logger, loggerMiddleware };
