import { ProblemDetail, ValidationProblem } from "../mfa/types";

export interface MfaClientInterface {
  retrieve: () => Promise<ApiResponse<MfaMethod[]>>;
  create: (method: Method) => Promise<ApiResponse<MfaMethod>>;
  update: (method: MfaMethod) => Promise<ApiResponse<MfaMethod[]>>;
  delete: (method: MfaMethod) => Promise<ApiResponse<any>>;
  makeDefault: (method: MfaMethod) => Promise<ApiResponse<MfaMethod[]>>;
}

export interface MfaMethod {
  mfaIdentifier: string;
  priorityIdentifier: PriorityIdentifier;
  method: Method;
  methodVerified: boolean;
}

export interface Method {
  type: string;
}

export interface SmsMethod extends Method {
  type: "SMS";
  phoneNumber: string;
}

export interface AuthAppMethod extends Method {
  type: "AUTH_APP";
  credential: string;
}

export type PriorityIdentifier = "DEFAULT" | "BACKUP";

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  data: T;
  problem?: ValidationProblem | ProblemDetail;
}
