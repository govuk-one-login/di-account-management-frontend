import {
  UpdateInformationInput,
  UpdateInformationSessionValues,
} from "../../utils/types";

export interface ChangeAuthenticatorAppServiceInterface {
  updateAuthenticatorApp: (
    updateInput: UpdateInformationInput,
    sessionDetails: UpdateInformationSessionValues
  ) => Promise<boolean>;
}
