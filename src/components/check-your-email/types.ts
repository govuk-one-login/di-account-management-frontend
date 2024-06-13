import {
  UpdateInformationInput,
  UpdateInformationSessionValues,
} from "../../utils/types.js";

export interface CheckYourEmailServiceInterface {
  updateEmail: (
    updateInput: UpdateInformationInput,
    sessionDetails: UpdateInformationSessionValues
  ) => Promise<boolean>;
}
