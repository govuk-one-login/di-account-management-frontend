import { ApiResponseResult } from "../../utils/types";

export interface EnterPasswordServiceInterface {
  authenticated: (
    token: string,
    email: string,
    password: string,
    sourceIp: string,
    sessionId: string,
    persistentSessionId: string
  ) => Promise<ApiResponseResult>;
}
