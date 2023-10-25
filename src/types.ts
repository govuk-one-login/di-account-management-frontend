import { ValidationChain } from "express-validator";
import "express-session";
import { NextFunction, Request, Response } from "express";

export interface OIDCConfig {
  idp_url: string;
  callback_url: string;
  client_id: string;
  scopes: string | string[];
}

export type ExpressRouteFunc = (
  req: Request,
  res: Response,
  next?: NextFunction
) => void | Promise<void>;

export type ValidationChainFunc = (
  | ValidationChain
  | ((req: Request, res: Response, next: NextFunction) => any)
)[];

declare module "express-session" {
  export interface SessionData {
    // The express-session middleware manages this:
    cookie: Cookie;

    nonce?: string;
    state?: string;
    currentURL?: string;
    user?: User;
    user_id?: string;
    referenceCode?: string;
    fromURL?: string;
    appSessionId?: string;
    appErrorCode?: string;
  }
}

interface Cookie {
  originalMaxAge: number;
  expires: string;
  secure: boolean;
  httpOnly: boolean;
  path: string;
}

interface User {
  email: string;
  phoneNumber: string;
  isPhoneNumberVerified: boolean;
  subjectId: string;
  tokens: {
    idToken: string;
    accessToken: string;
    refreshToken: string;
  };
  isAuthenticated: boolean;
}
