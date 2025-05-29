import { Request, Response } from "express";
import { getInitialState } from "../../src/utils/state-machine";
import { Session, SessionData } from "express-session";
import { IncomingHttpHeaders } from "http";

export const CURRENT_EMAIL = "current-email@dl.com";
export const NEW_EMAIL = "new-email@test.com";
export const TOKEN = "token";
export const SOURCE_IP = "sourceip";
export const ENGLISH = "en";

export const SESSION_ID = "sessionid";
export const PERSISTENT_SESSION_ID = "persistentsessionid";
export const CLIENT_SESSION_ID = "clientsessionid";

export const TXMA_AUDIT_ENCODED = "txma-audit-encoded";

export class RequestBuilder {
  private body: object | null = null;
  private session: Session & Partial<SessionData> = {
    user: {
      tokens: {
        accessToken: TOKEN,
        idToken: "",
        refreshToken: "",
      },
      email: CURRENT_EMAIL,
      state: { changeEmail: getInitialState() },
      isAuthenticated: false,
    },
  } as any;
  private cookies: object = { lng: ENGLISH };
  private ip: string = SOURCE_IP;
  private i18n: object = { language: ENGLISH };
  private headers: object = {
    "txma-audit-encoded": TXMA_AUDIT_ENCODED,
  };
  private t: () => void;

  withBody(body: object): RequestBuilder {
    this.body = body;
    return this;
  }

  withSession(session: Session & Partial<SessionData>): RequestBuilder {
    this.session = session;
    return this;
  }

  withSessionUserState(state: object): RequestBuilder {
    this.session.user.state = state;
    return this;
  }

  withMfaMethods(): RequestBuilder {
    this.session.mfaMethods = [
      {
        mfaIdentifier: "1",
        priorityIdentifier: "DEFAULT",
        methodVerified: true,
        method: {
          mfaMethodType: "SMS",
          phoneNumber: "0123456789",
        },
      },
    ];
    return this;
  }

  withNoDefaultMfaMethods(): RequestBuilder {
    this.session.mfaMethods = [
      {
        mfaIdentifier: "1",
        priorityIdentifier: "BACKUP",
        methodVerified: true,
        method: {
          mfaMethodType: "SMS",
          phoneNumber: "0123456789",
        },
      },
    ];
    return this;
  }

  withCookies(cookies: object): RequestBuilder {
    this.cookies = cookies;
    return this;
  }

  withHeaders(headers: object): RequestBuilder {
    this.headers = headers;
    return this;
  }

  withI18n(i18n: object): RequestBuilder {
    this.i18n = i18n;
    return this;
  }

  withTranslate(func: () => void): RequestBuilder {
    this.t = func;
    return this;
  }

  withIp(ip: string): RequestBuilder {
    this.ip = ip;
    return this;
  }

  withAuthSessionIds(
    sessionId: string,
    clientSessionId: string
  ): RequestBuilder {
    this.session.authSessionIds = {
      sessionId,
      clientSessionId,
    };
    return this;
  }

  build(): Partial<Request> {
    return {
      body: this.body,
      session: this.session,
      cookies: this.cookies,
      i18n: this.i18n,
      headers: this.headers as IncomingHttpHeaders,
      t: this.t as any,
      ip: this.ip,
    };
  }
}

export class ResponseBuilder {
  private render: () => void;
  private redirect: () => void;
  private locals: object = {
    clientSessionId: CLIENT_SESSION_ID,
    persistentSessionId: PERSISTENT_SESSION_ID,
    sessionId: SESSION_ID,
  };
  private status: () => number = () => {
    return 200;
  };

  withStatus(func: () => number): ResponseBuilder {
    this.status = func;
    return this;
  }
  withRender(func: () => void): ResponseBuilder {
    this.render = func;
    return this;
  }

  withRedirect(func: () => void): ResponseBuilder {
    this.redirect = func;
    return this;
  }

  withLocals(locals: object): ResponseBuilder {
    this.locals = locals;
    return this;
  }

  build(): Partial<Response> {
    return {
      render: this.render,
      redirect: this.redirect,
      locals: this.locals,
      status: this.status as any,
    };
  }
}
