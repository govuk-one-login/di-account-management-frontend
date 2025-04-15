import { AuthAppMethod, SmsMethod } from "./types";

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
