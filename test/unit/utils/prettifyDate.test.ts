import { expect } from "chai";
import { describe } from "mocha";
import { prettifyDate } from "../../../src/utils/prettifyDate";

describe("PrettifyDate util", () => {
    it("It takes a date epoch in seconds and returns a pretty formatted date", async () => {
        const dateEpochInSeconds = 1673358736;
        expect(prettifyDate(dateEpochInSeconds)).equal("10 January 2023");
    });
    
    it("It takes a date epoch in milliseconds and returns a pretty formatted date", async () => {
    const dateEpochInSeconds = 2382450028987;
    expect(prettifyDate(dateEpochInSeconds)).equal("30 June 2045");
    });
}) 