import { expect } from "@playwright/test";
import { bdd } from "./fixtures";

const { Given, Then } = bdd;

Given(
  "I enter and submit my new mobile phone number {string}",
  async ({ page }, newPhoneNumber: string) => {
    await page.getByLabel("Phone number").fill(newPhoneNumber);
    await page.getByRole("button", { name: "Continue" }).click();
  }
);

Given(
  "I enter and submit the code {string} sent to my new mobile number ending {string}",
  async ({ page }, otp: string, newPhoneNumber: string) => {
    expect(
      page.getByText(
        `We have sent a code to your phone number ending with ${newPhoneNumber}`
      )
    ).toBeVisible;
    await page.getByLabel("Enter the 6 digit code").fill(otp);
    await page.getByRole("button", { name: "Continue" }).click();
  }
);

Then(
  "I am shown a message confirming that my phone number has been changed",
  async ({ page }) => {
    await expect(
      page.getByText("You’ve changed your phone number")
    ).toHaveCount(1);
  }
);

Then(
  "I am shown a message confirming security codes will be sent to my phone number ending {string}",
  async ({ page }, newPhoneNumber: string) => {
    await expect(
      page.getByText(
        `We’ll send security codes to your phone number ending with ${newPhoneNumber}`
      )
    ).toHaveCount(1);
  }
);

Given(
  "I enter and submit a non-UK phone number {string}",
  async ({ page }, newPhoneNumber: string) => {
    await page.getByLabel("Phone number").fill(newPhoneNumber);
    await page.getByRole("button", { name: "Continue" }).click();
  }
);

Then(
  "I am shown an error message saying {string}",
  async ({ page }, errorMessage: string) => {
    await expect(page.getByText(errorMessage)).toBeVisible();
  }
);

Then("there is a link to the phone number input field", async ({ page }) => {
  await expect(
    page.getByRole("link", { name: "Enter a UK mobile phone number" })
  ).toBeVisible();
});

Given(
  'I click the link "I do not have a UK mobile phone number"',
  async ({ page }) => {
    await page
      .getByRole("link", { name: "I do not have a UK mobile phone number" })
      .click();
  }
);

Then("I am shown a message explaining what I can do", async ({ page }) => {
  await expect(
    page.getByText(
      "To get security codes by text message, you need to use a UK mobile phone number."
    )
  ).toBeVisible();
});

Then(
  "I am shown a message explaining what an authenticator app is",
  async ({ page }) => {
    await expect(page.getByText("What is an authenticator app?")).toHaveCount(
      2
    );
  }
);

Then("there is a {string} button", async ({ page }, buttonText: string) => {
  await expect(page.getByRole("button", { name: buttonText })).toBeVisible();
});
