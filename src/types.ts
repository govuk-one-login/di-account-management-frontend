import "express-session";
import { NextFunction, Request, Response } from "express";
import { ValidationChain } from "express-validator";
import { StateAction, UserJourney } from "./utils/state-machine";

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

interface UserTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
}

type UserState = Partial<Record<UserJourney, StateAction>>;

export interface User {
  phoneNumber?: string;
  newEmailAddress?: string;
  newPhoneNumber?: string;
  email?: string;
  isPhoneNumberVerified?: boolean;
  subjectId?: string;
  legacySubjectId?: string;
  publicSubjectId?: string;
  tokens?: UserTokens;
  isAuthenticated: boolean;
  state?: UserState;
  authAppSecret?: string;
}

export interface DeviceIntelligence {
  ip_address?: string;
  user_agent?: string;
  country_code?: string;
}
