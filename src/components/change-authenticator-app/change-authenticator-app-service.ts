import { ChangeAuthenticatorAppServiceInterface } from "./types.js";
import {
  UpdateInformationInput,
  UpdateInformationSessionValues,
} from "../../utils/types.js";
import { updateMfaMethod } from "../../utils/mfa/index.js";

export function changeAuthenticatorAppService(): ChangeAuthenticatorAppServiceInterface {
  const updateAuthenticatorApp = async function (
    updateInput: UpdateInformationInput,
    sessionDetails: UpdateInformationSessionValues
  ): Promise<boolean> {
    return updateMfaMethod(updateInput, sessionDetails);
  };

  return {
    updateAuthenticatorApp,
  };
}
