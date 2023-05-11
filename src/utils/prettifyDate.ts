export const prettifyDate = (dateEpoch: number, options?: Record<string, unknown>): string => {
  const params = options || { dateStyle: "long" }
  let dateEpochInMilliSeconds: number;
  if (dateEpoch.toString().length === 10) {
    // Epoch is in seconds
    dateEpochInMilliSeconds = dateEpoch * 1000;
  } else {
    // Epoch is in milliseconds
    dateEpochInMilliSeconds = dateEpoch;
  }

  return new Intl.DateTimeFormat("en-GB", params).format(
    new Date(dateEpochInMilliSeconds)
  );
};