export interface MfaClientInterface {
  retrieve: () => Promise<ApiResponse<MfaMethod[]>>;
  create: (
    method: SmsMethod | AuthAppMethod,
    otp?: string
  ) => Promise<ApiResponse<MfaMethod>>;
  update: (
    method: MfaMethod,
    otp?: string
  ) => Promise<ApiResponse<MfaMethod[]>>;
  delete: (method: MfaMethod) => Promise<ApiResponse<any>>;
  makeDefault: (mfaIdentifier: string) => Promise<ApiResponse<MfaMethod[]>>;
}

export interface MfaMethod {
  mfaIdentifier: string;
  priorityIdentifier: PriorityIdentifier;
  method: SmsMethod | AuthAppMethod;
  methodVerified?: boolean;
}

export interface SmsMethod {
  mfaMethodType: "SMS";
  phoneNumber: string;
}

export interface AuthAppMethod {
  mfaMethodType: "AUTH_APP";
  credential: string;
}

export type PriorityIdentifier = "DEFAULT" | "BACKUP";

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  data: T;
  error?: SimpleError;
}

export interface CreateMfaPayload {
  priorityIdentifier: PriorityIdentifier;
  method: (SmsMethod | AuthAppMethod) & { otp?: string };
}

export interface UpdateMfaPayload {
  mfaIdentifier: string;
  priorityIdentifier: PriorityIdentifier;
  method: (SmsMethod | AuthAppMethod) & { otp?: string };
  methodVerified?: boolean;
}

export interface SimpleError {
  code: number;
  message: string;
}
