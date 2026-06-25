import { expect } from "@playwright/test";
import { bdd } from "./fixtures";

const { Given, Then } = bdd;

Then("there is a list of activity history items", async ({ page }) => {
  const count = await page.getByTestId("activity-history-list-item").count();
  expect(count).toBeGreaterThan(1);
});

Given(
  "I enter and submit my new password {string}",
  async ({ page }, newPassword: string) => {
    await page.getByLabel("Enter a new password").fill(newPassword);
    await page.getByLabel("Re-type your new password").fill(newPassword);
    await page.getByRole("button", { name: "Continue" }).click();
  }
);

Given(
  "I enter and submit my new password {string} erroneously",
  async ({ page }, newPassword: string) => {
    await page.getByLabel("Enter a new password").fill(newPassword);
    await page
      .getByLabel("Re-type your new password")
      .fill(`${newPassword}notmatchy`);
    await page.getByRole("button", { name: "Continue" }).click();
  }
);
