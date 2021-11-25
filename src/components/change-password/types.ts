import { ApiResponseResult } from "../../utils/types";

export interface ChangePasswordServiceInterface {
  updatePassword: (
    accessToken: string,
    email: string,
    newPassword: string,
    sourceIp: string,
    persistentSessionId: string
  ) => Promise<ApiResponseResult>;
}
