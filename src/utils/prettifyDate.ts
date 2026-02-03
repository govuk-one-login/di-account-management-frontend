import { LANGUAGE_CODES } from "../app.constants.js";

export const prettifyDate = ({
  dateEpoch,
  locale,
  options = { dateStyle: "long" },
}: {
  dateEpoch: number;
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
}): string => {
  const languageCode =
    LANGUAGE_CODES[locale as keyof typeof LANGUAGE_CODES] || "en-GB";
  let dateEpochInMilliSeconds: number;
  if (dateEpoch.toString().length === 10) {
    // Epoch is in seconds
    dateEpochInMilliSeconds = dateEpoch * 1000;
  } else {
    // Epoch is in milliseconds
    dateEpochInMilliSeconds = dateEpoch;
  }

  return new Intl.DateTimeFormat(languageCode, options).format(
    new Date(dateEpochInMilliSeconds)
  );
};
