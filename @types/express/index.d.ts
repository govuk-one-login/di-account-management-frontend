import { Session } from "express-session";
import { Client } from "openid-client";
import { User } from "../../src/types";

declare module "express-session" {
  interface OneLoginSession {
    timestamp?: number;
    nonce?: string;
    state?: string;
    currentURL?: string;
    user?: User;
    user_id?: string;
    referenceCode?: string;
    queryParameters: {
      fromURL?: string;
      appSessionId?: string;
      appErrorCode?: string;
      theme?: string;
    };
  }
}
declare module "express-serve-static-core" {
  interface Request {
    i18n?: {
      language?: string;
    };
    csrfToken?: () => string;
    session: Session & OneLoginSession;
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
