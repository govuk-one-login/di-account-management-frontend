import { expect } from "@playwright/test";
import { bdd } from "./fixtures";

const { Given, Then } = bdd;

Given("I search for {string}", async ({ page }, searchTerm: string) => {
  await page.getByLabel("Search for a service").fill(searchTerm);
  await page
    .getByRole("button", {
      name: "Search for services using GOV.UK One Login",
      exact: true,
    })
    .click();
});

Then(
  "there is a search result with the text {string}",
  async ({ page }, searchResultText: string) => {
    await expect(page.getByText(searchResultText, { exact: true })).toHaveCount(
      1
    );
  }
);
