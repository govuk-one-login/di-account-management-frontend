import { Client } from "openid-client";
import { User } from "../../src/types";
import { QueryParameters } from "../../src/app.constants";
import { MfaMethod } from "../../src/utils/mfaClient/types";
import { logger } from "../../src/utils/logger";

declare module "express-session" {
  interface Session {
    timestamp?: number;
    nonce?: string;
    state?: string;
    currentURL?: string;
    user?: User;
    user_id?: string;
    referenceCode?: string;
    referenceCodeOwningSessionId?: string;
    queryParameters?: QueryParameters;
    sessionId?: string;
    mfaMethods?: MfaMethod[];
    removedMfaMethod?: MfaMethod;
    newDefaultMfaMethodId: string | number;
    authSessionIds?: {
      sessionId: string;
      clientSessionId: string;
    };
  }
}
declare module "express-serve-static-core" {
  interface Request {
    i18n?: {
      language?: string;
    };
    language?: LOCALE;
    t?: (string) => string;
    csrfToken?: () => string;
    oidc?: Client;
    issuerJWKS?: any;
    log: logger;
    metrics?: Metrics;
  }
}
interface Cookie {
  originalMaxAge: number;
  expires: string;
  secure: boolean;
  httpOnly: boolean;
  path: string;
}
