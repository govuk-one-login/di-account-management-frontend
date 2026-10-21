import { RequestConfig } from "../../utils/http.js";
import { UserJourney } from "../../utils/state-machine.js";
import { UpdateInformationInput } from "../../utils/types.js";

export enum CheckYourEmailServiceError {
  EMAIL_ADDRESS_DENIED = "EMAIL_ADDRESS_DENIED",
  REQUEST_MISSING_PARAMS = "REQUEST_MISSING_PARAMS",
  ACCT_WITH_EMAIL_EXISTS = "ACCT_WITH_EMAIL_EXISTS",
  ACCT_DOES_NOT_EXIST = "ACCT_DOES_NOT_EXIST",
  INVALID_OTP = "INVALID_OTP",
  EMAIL_ADDRESSES_MATCH = "EMAIL_ADDRESSES_MATCH",
  INVALID_EMAIL_FORMAT = "INVALID_EMAIL_FORMAT",
  EMAIL_ADDRESS_EMPTY = "EMAIL_ADDRESS_EMPTY",
}

export interface CheckYourEmailServiceInterface {
  updateEmail: (
    updateInput: UpdateInformationInput,
    requestConfig: RequestConfig
  ) => Promise<{
    success: boolean;
    responseCode?: number;
    responseMessage?: string;
  }>;
}

export const INTENT_CHANGE_PHONE_NUMBER = UserJourney.ChangePhoneNumber;
export const INTENT_ADD_BACKUP = UserJourney.addBackup;
export const INTENT_CHANGE_DEFAULT_METHOD = UserJourney.ChangeDefaultMethod;

export const ALL_INTENTS = [
  INTENT_CHANGE_PHONE_NUMBER,
  INTENT_ADD_BACKUP,
  INTENT_CHANGE_DEFAULT_METHOD,
] as const;

export type Intent = (typeof ALL_INTENTS)[number];
