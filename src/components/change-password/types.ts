import { RequestConfig } from "../../utils/http";
import { ApiResponseResult } from "../../utils/types";

export interface ChangePasswordServiceInterface {
  updatePassword: (
    email: string,
    newPassword: string,
    requestConfig: RequestConfig
  ) => Promise<ApiResponseResult>;
}
