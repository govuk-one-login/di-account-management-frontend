import "express-session";
import { NextFunction, Request, Response } from "express";
import { ValidationChain } from "express-validator";
import { StateAction, UserJourney } from "./utils/state-machine.js";
import { PATH_DATA } from "./app.constants.js";

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
  accountDataApiAccessToken?: string;
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

export type AMJourneyValidBackRouteKey =
  | "security"
  | "sign-in-details"
  | "activity-history";

interface AMJourneyBackRouteConfig {
  url: string;
  translationKey: string;
}

export const AMJourneyValidBackRoutes = {
  security: {
    url: PATH_DATA.SECURITY.url,
    translationKey: "general.cancelAndGoBackText",
  },
  "sign-in-details": {
    url: PATH_DATA.SIGN_IN_DETAILS.url,
    translationKey: "general.cancelAndGoBackText",
  },
  "activity-history": {
    url: PATH_DATA.SIGN_IN_HISTORY.url,
    translationKey: "general.cancelAndGoBackText",
  },
} as const satisfies Record<
  AMJourneyValidBackRouteKey,
  AMJourneyBackRouteConfig
>;
