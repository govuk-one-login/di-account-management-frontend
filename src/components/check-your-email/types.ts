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
