export type PriorityIdentifier = "DEFAULT" | "BACKUP";
export type MfaMethodType = "SMS" | "AUTH_APP";

export interface MfaMethod {
  mfaIdentifier?: number;
  priorityIdentifier: PriorityIdentifier;
  method: {
    mfaMethodType: MfaMethodType;
    endPoint?: string;
  };
  methodVerified?: boolean;
  smsPhoneNumber?: string;
}

export interface AddMfaMethod {
  mfaIdentifier?: number;
  priorityIdentifier: PriorityIdentifier;
  mfaMethodType: MfaMethodType;
}

export interface ProblemDetail {
  type?: string;
  /** @example MFA Method could not be updated. */
  title?: string;
  status?: string;
  /** @example Database error */
  detail?: string;
  /** @example /mfa-methods/{mfaIdentifier} */
  resource?: string;
  extension?: {
    error?: {
      /** @enum {unknown} */
      code?: 1056 | 1057 | 1058;
    };
  };
}

export interface ValidationProblem {
  type?: string;
  title?: string;
  errors?: Error[];
}

export interface Error {
  detail?: string;
  pointer?: string;
}
