import { RequestConfig } from "../../utils/http";
import { UserJourney } from "../../utils/state-machine";
import { UpdateInformationInput } from "../../utils/types";

export interface CheckYourEmailServiceInterface {
  updateEmail: (
    updateInput: UpdateInformationInput,
    requestConfig: RequestConfig
  ) => Promise<boolean>;
}

export const INTENT_CHANGE_PHONE_NUMBER = UserJourney.ChangePhoneNumber;
export const INTENT_ADD_BACKUP = UserJourney.addBackup;
export const INTENT_CHANGE_DEFAULT_METHOD = UserJourney.ChangeDefaultMethod;

export type Intent =
  | typeof INTENT_CHANGE_PHONE_NUMBER
  | typeof INTENT_ADD_BACKUP
  | typeof INTENT_CHANGE_DEFAULT_METHOD;
