import { expect } from "@playwright/test";
import { bdd } from "./fixtures";

const { Given, Then } = bdd;

Given(
  "I enter and submit my new email address {string}",
  async ({ page }, newEmailAddress: string) => {
    await page.getByLabel("Email address").fill(newEmailAddress);
    await page.getByRole("button", { name: "Continue" }).click();
  }
);

Given(
  "I enter and submit the code {string} sent to my new email address {string}",
  async ({ page }, otp: string, newEmailAddress: string) => {
    await expect(
      page.getByText(`We have sent an email to: ${newEmailAddress}`)
    ).toHaveCount(1);
    await page.getByLabel("Enter the 6 digit code").fill(otp);
    await page.getByRole("button", { name: "Continue" }).click();
  }
);

Then(
  "I am shown a message confirming that my email address has been changed to {string}",
  async ({ page }, newEmailAddress: string) => {
    await expect(
      page.getByText("You’ve changed your email address")
    ).toHaveCount(1);
    await expect(
      page.getByText(
        `Your email address has been changed to ${newEmailAddress}`
      )
    ).toHaveCount(1);
  }
);

Then(
  "I am shown an error message explaining that this email address can't be used",
  async ({ page }) => {
    await expect(
      page.getByRole("link", {
        name: "You are unable to use that email address. Enter a different email address.",
      })
    ).toBeVisible();
  }
);
