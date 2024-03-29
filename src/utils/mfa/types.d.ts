export interface MfaMethod {
  mfaIdentifier: number;
  priorityIdentifier: "PRIMARY" | "SECONDARY";
  mfaMethodType: "SMS" | "AUTH_APP";
  endPoint: string;
  methodVerified: boolean;
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
