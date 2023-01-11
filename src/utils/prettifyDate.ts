export const prettifyDate = (dateEpoch: number): string => {
    let dateEpochInMilliSeconds: number;
    if (dateEpoch.toString().length === 10) {
      // Epoch is in seconds
      dateEpochInMilliSeconds = dateEpoch * 1000;
    } else {
      // Epoch is in milliseconds
      dateEpochInMilliSeconds = dateEpoch;
    }
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(
      new Date(dateEpochInMilliSeconds)
    );
  };