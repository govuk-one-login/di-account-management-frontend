import { AuthAppMethod, MfaMethod, SmsMethod } from "./types.js";

export function validateCreate(
  method: AuthAppMethod | SmsMethod,
  otp?: string
) {
  if (method.mfaMethodType == "AUTH_APP" && otp) {
    throw new Error("Must not provide OTP when mfaMethodType is AUTH_APP");
  }

  if (method.mfaMethodType == "SMS" && !otp) {
    throw new Error("Must provide OTP when mfaMethodType is SMS");
  }
}

export function validateUpdate(method: MfaMethod, otp?: string) {
  if (method.method.mfaMethodType != "SMS" && otp) {
    throw new Error("Must only provide OTP with an SMS method update");
  }
}
