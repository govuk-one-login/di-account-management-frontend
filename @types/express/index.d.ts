import { Client } from "openid-client";
import { User } from "../../src/types";
import { QueryParameters, MfaMethod } from "../../src/app.constants";

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
  }
}
declare module "express-serve-static-core" {
  interface Request {
    i18n?: {
      language?: string;
    };
    language?: string;
    t?: (string) => string;
    csrfToken?: () => string;
    oidc?: Client;
    issuerJWKS?: any;
  }
}
interface Cookie {
  originalMaxAge: number;
  expires: string;
  secure: boolean;
  httpOnly: boolean;
  path: string;
}
