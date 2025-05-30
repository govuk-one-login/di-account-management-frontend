import { RequestConfig } from "../../utils/http";
import { UpdateInformationInput } from "../../utils/types";

export interface CheckYourPhoneServiceInterface {
  updatePhoneNumber: (
    updateInput: UpdateInformationInput,
    requestConfig: RequestConfig
  ) => Promise<boolean>;
}
