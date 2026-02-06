import { expect } from "chai";
import { describe } from "mocha";
import { prettifyDate } from "../../../src/utils/prettifyDate.js";

describe("PrettifyDate util", () => {
  it("takes a date epoch in seconds and returns a pretty formatted date", async () => {
    const dateEpochInSeconds = 1673358736;
    expect(prettifyDate({ dateEpoch: dateEpochInSeconds })).equal(
      "10 January 2023"
    );
  });

  it("takes a date epoch in milliseconds and returns a pretty formatted date", async () => {
    const dateEpochInSeconds = 2382450028987;
    expect(prettifyDate({ dateEpoch: dateEpochInSeconds })).equal(
      "30 June 2045"
    );
  });

  it("allows passing formatting options", async () => {
    const dateEpochInSeconds = 1673358736;
    expect(
      prettifyDate({
        dateEpoch: dateEpochInSeconds,
        options: {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          hourCycle: "h12",
          timeZone: "GB",
        },
      })
    ).equal("10 January 2023 at 1:52 pm");
  });

  it("returns Welsh version when locale parameter is 'cy'", async () => {
    const dateEpochInSeconds = 2382450028987;
    expect(prettifyDate({ dateEpoch: dateEpochInSeconds, locale: "cy" })).equal(
      "30 Mehefin 2045"
    );
  });

  it("returns date in English if locale parameter is invalid", async () => {
    const dateEpochInSeconds = 2382450028987;
    expect(
      prettifyDate({ dateEpoch: dateEpochInSeconds, locale: "asdf" })
    ).equal("30 June 2045");
  });
});
