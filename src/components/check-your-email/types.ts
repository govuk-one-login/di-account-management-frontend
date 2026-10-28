import { RequestConfig } from "../../utils/http.js";
import { UserJourney } from "../../utils/state-machine.js";
import { UpdateInformationInput } from "../../utils/types.js";

export interface CheckYourEmailServiceInterface {
  updateEmail: (
    updateInput: UpdateInformationInput,
    requestConfig: RequestConfig
  ) => Promise<{
    success: boolean;
    code?: number;
    message?: string;
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
