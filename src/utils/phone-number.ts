import {
  isValidPhoneNumber,
  parsePhoneNumberWithError,
} from "libphonenumber-js/mobile";

export function containsUKMobileNumber(value: string): boolean {
  try {
    return (
      isValidPhoneNumber(value, "GB") &&
      parsePhoneNumberWithError(value, "GB").countryCallingCode === "44"
    );
  } catch {
    return false;
  }
}

export function containsInternationalMobileNumber(value: string): boolean {
  const formattedNumber = convertInternationalPhoneNumberToE164Format(value);
  return isValidPhoneNumber(formattedNumber);
}

export function containsLeadingPlusNumbersOrSpacesOnly(value: string): boolean {
  return value ? /^\+?[\d\s]+$/.test(value) : false;
}

export function convertInternationalPhoneNumberToE164Format(
  value: string
): string {
  if (value.startsWith("+")) {
    return value;
  }

  if (value.startsWith("00")) {
    return value.replace("00", "+");
  }

  return "+".concat(value);
}

export function lengthInRangeWithoutSpaces(
  value: string,
  min: number,
  max: number
): boolean {
  const length = value.replace(/\s+/g, "").length;
  return length >= min && length <= max;
}
