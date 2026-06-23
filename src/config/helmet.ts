import { HelmetOptions } from "helmet";
import { Request, Response } from "express";

type CspDirectiveValue = string | ((req: Request, res: Response) => string);

// Helmet does not export the config type - This is the way the recommend getting it on GitHub.
export const helmetConfiguration: HelmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        (req: Request, res: Response): string =>
          `'nonce-${res.locals.scriptNonce}'`,
        "'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='",
        "https://*.googletagmanager.com",
        "https://*.google-analytics.com",
        "https://*.analytics.google.com",
        "https://*.ruxit.com",
        "https://*.dynatrace.com",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https://*.googletagmanager.com",
        "https://*.google-analytics.com",
        "https://*.analytics.google.com",
        "https://*.g.doubleclick.net",
      ],
      objectSrc: ["'none'"],
      connectSrc: [
        "'self'",
        "https://*.google-analytics.com",
        "https://*.analytics.google.com",
        "https://*.g.doubleclick.net",
        "https://*.ruxit.com",
        "https://*.dynatrace.com",
      ],
      formAction: ["'self'", "https://*.account.gov.uk"],
    },
  },
  dnsPrefetchControl: {
    allow: false,
  },
  frameguard: {
    action: "deny",
  },
  hsts: {
    maxAge: 31536000, // 1 Year
    preload: true,
    includeSubDomains: true,
  },
  referrerPolicy: false,
  permittedCrossDomainPolicies: {
    permittedPolicies: "none",
  },
};

const baseCspDirectives = (
  helmetConfiguration.contentSecurityPolicy as { directives: unknown }
).directives as Record<string, CspDirectiveValue[]>;

export const webchatHelmetConfiguration: HelmetOptions = {
  ...helmetConfiguration,
  contentSecurityPolicy: {
    directives: {
      ...baseCspDirectives,
      styleSrc: [
        ...baseCspDirectives.styleSrc,
        (req: Request, res: Response): string =>
          `'nonce-${res.locals.scriptNonce}'`,
        "https://*.smartagent.app",
        "https://fonts.cdnfonts.com",
      ],
      scriptSrc: [
        ...baseCspDirectives.scriptSrc,
        "https://*.g.doubleclick.net",
        "https://*.smartagent.app",
        "'strict-dynamic'",
      ],
      scriptSrcAttr: ["'self'", "'unsafe-inline'"],
      imgSrc: [
        ...baseCspDirectives.imgSrc,
        "https://*.s3.eu-west-2.amazonaws.com",
      ],
      connectSrc: [
        ...baseCspDirectives.connectSrc,
        "https://*.smartagent.app",
        "https://participant.connect.eu-west-2.amazonaws.com",
        (req: Request, res: Response): string =>
          `${res.locals.missionLabWebSocketAddress}`,
        "wss://*.transport.connect.eu-west-2.amazonaws.com",
        " https://api.rollbar.com",
      ],
      workerSrc: ["blob:"],
      mediaSrc: ["'self'", "https://*.s3.eu-west-2.amazonaws.com"],
      frameSrc: ["'self'", "https://*.smartagent.app"],
    },
  },
};
