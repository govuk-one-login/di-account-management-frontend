import { UpdateInformationInput, UpdateInformationSessionValues } from "../../utils/types";

export interface CheckYourPhoneServiceInterface {
  updatePhoneNumber: (
    updateInput : UpdateInformationInput,
    sessionDetails: UpdateInformationSessionValues
  ) => Promise<boolean>;
}
