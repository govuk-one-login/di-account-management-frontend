

declare namespace Express {
  import {Client} from "openid-client";
  interface Request {
    i18n?: {
      language?: string;
    };
    t: TFunction;
    csrfToken?: () => string;
    session: any;
    oidc?: Client;
  }
}
