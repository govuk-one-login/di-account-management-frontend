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
  return isValidPhoneNumber(prependInternationalPrefix(value));
}

export function containsLeadingPlusNumbersOrSpacesOnly(value: string): boolean {
  return value ? /^\+?[\d\s]+$/.test(value) : false;
}

export function prependInternationalPrefix(value: string): string {
  return value.startsWith("+") ? value : "+".concat(value);
}

export function lengthInRangeWithoutSpaces(
  value: string,
  min: number,
  max: number
): boolean {
  const length = value.replace(/\s+/g, "").length;
  return length >= min && length <= max;
}
