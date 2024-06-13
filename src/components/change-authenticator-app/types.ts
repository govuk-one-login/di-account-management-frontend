import {
  UpdateInformationInput,
  UpdateInformationSessionValues,
} from "../../utils/types.js";

export interface ChangeAuthenticatorAppServiceInterface {
  updateAuthenticatorApp: (
    updateInput: UpdateInformationInput,
    sessionDetails: UpdateInformationSessionValues
  ) => Promise<boolean>;
}
