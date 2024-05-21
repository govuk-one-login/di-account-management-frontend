import { ChangeAuthenticatorAppServiceInterface } from "./types";
import {
  UpdateInformationInput,
  UpdateInformationSessionValues,
} from "../../utils/types";
import { updateMfaMethod } from "../../utils/mfa";

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
