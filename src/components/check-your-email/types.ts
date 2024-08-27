import {
  UpdateInformationInput,
  UpdateInformationSessionValues,
} from "../../utils/types";

export interface CheckYourEmailServiceInterface {
  updateEmail: (
    updateInput: UpdateInformationInput,
    sessionDetails: UpdateInformationSessionValues
  ) => Promise<boolean>;
}

export const INTENT_CHANGE_PHONE_NUMBER = "changePhoneNumber";
export const INTENT_ADD_MFA_METHOD = "addMfaMethod";
export const INTENT_CHANGE_DEFAULT_METHOD = "changeDefaultMethod";

export type Intent =
  | typeof INTENT_CHANGE_PHONE_NUMBER
  | typeof INTENT_ADD_MFA_METHOD
  | typeof INTENT_CHANGE_DEFAULT_METHOD;
