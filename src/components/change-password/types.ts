import { ApiResponseResult } from "../../utils/types";

export interface ChangePasswordServiceInterface {
  updatePassword: (
    accessToken: string,
    email: string,
    newPassword: string,
    sourceIp: string,
    sessionId: string,
    persistentSessionId: string,
    userLanguage: string,
    clientSessionId: string,
    txmaAuditEnocded: string
  ) => Promise<ApiResponseResult>;
}
