import { expect } from "@playwright/test";
import { bdd } from "./fixtures";

const { Given, Then } = bdd;

Given("I click the {string} link", async ({ page }, linkText: string) => {
  await page.getByRole("link", { name: linkText }).click();
});

Then(
  "The page title is preixed with {string}",
  async ({ page }, titlePrefix: string) => {
    await expect(page).toHaveTitle(new RegExp(`^${titlePrefix}`));
  }
);

Given("I click the {string} button", async ({ page }, buttonText: string) => {
  await page.getByRole("button", { name: buttonText }).click();
});

Given(
  "I enter and submit my new mobile phone number {string}",
  async ({ page }, newPhoneNumber: string) => {
    await page.getByLabel("Phone number").fill(newPhoneNumber);
    await page.getByRole("button", { name: "Continue" }).click();
  }
);

Then(
  "I am shown a message confirming a code has been sent to my new phone number ending {string}",
  async ({ page }, newPhoneNumber: string) => {
    await expect(
      page.getByText(
        `We have sent a code to your phone number ending with ${newPhoneNumber}`
      )
    ).toBeVisible();
  }
);

Given(
  "I enter and submit the code {string} sent to my new mobile number ending {string}",
  async ({ page }, otp: string) => {
    await page.getByLabel("Enter the 6 digit code").fill(otp);
    await page.getByRole("button", { name: "Continue" }).click();
  }
);

Then(
  "I am shown a message confirming that my Default Method has been changed",
  async ({ page }) => {
    await expect(
      page.getByText(
        "You’ve changed your default method for getting security codes"
      )
    ).toHaveCount(1);
  }
);

// The following step is disabled pending fixing the stubs to return the correct data.
// Then("I am shown a message confirming security codes will be sent to my phone number ending {string}", async ({ page }, newPhoneNumber: string) => {
//   await expect(
//     page.getByText(`We’ll send security codes to your phone number ending with ${newPhoneNumber}`)
//   ).toHaveCount(1);
// });

Then("I am shown a message explaining what I can do", async ({ page }) => {
  await expect(
    page.getByText(
      "If you do not have a UK mobile phone number, you can only get security codes using an authenticator app."
    )
  ).toBeVisible();
  await expect(
    page.getByText("You already use your authenticator app to get codes.")
  ).toBeVisible();
});

Then(
  "I am shown a message explaining how to change to a different authenticator app",
  async ({ page }) => {
    await expect(
      page.getByText("If you want to use a different authenticator app:")
    ).toBeVisible();
    await expect(
      page.getByRole("listitem").getByText("Go back to Security")
    ).toBeVisible();
    await expect(
      page.getByRole("listitem").getByText("Select Change authenticator app")
    ).toBeVisible();
  }
);

Then("there is a {string} button", async ({ page }, buttonText: string) => {
  await expect(page.getByRole("button", { name: buttonText })).toBeVisible();
});
