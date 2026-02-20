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

Then("I can see two radio buttons", async ({ page }) => {
  const radioButtons = page.getByRole("radio");
  await expect(radioButtons).toHaveCount(2);
});

Then(
  "I can see a collapsed detail block {string}",
  async ({ page }, detailBlockTitle: string) => {
    await expect(page.getByText(detailBlockTitle)).toBeVisible();
  }
);

Given(
  "I click the detail block {string}",
  async ({ page }, detailBlockTitle: string) => {
    await page.getByText(detailBlockTitle).click();
  }
);

Then(
  "I can see the explanation details {string}",
  async ({ page }, explanationDetails: string) => {
    await expect(page.getByText(explanationDetails)).toBeVisible();
  }
);

Given(
  "I select {string} and click the {string} button",
  async ({ page }, radioOption: string, buttonText: string) => {
    await page.getByLabel(radioOption).check();
    await page.getByRole("button", { name: buttonText }).click();
  }
);

Then(
  "I am shown a message confirming that I have added a backup method",
  async ({ page }) => {
    await expect(
      page.getByText("You’ve added a back-up method for getting security codes")
    ).toBeVisible();
  }
);

Then(
  "I am shown a message confirming I can receive codes on my backup SMS number ending {string}",
  async ({ page }, newPhoneNumber: string) => {
    await expect(
      page.getByText(
        `If your default method for getting security codes is not available, you can get a code to your phone number ending with ${newPhoneNumber} instead.`
      )
    ).toHaveCount(1);
  }
);

Then("I can see the {string} button", async ({ page }, buttonText: string) => {
  await expect(page.getByRole("button", { name: buttonText })).toBeVisible();
});

Then(
  "I can see an explanation and link to start this journey again",
  async ({ page }) => {
    await expect(
      page.getByText(
        "To get security codes by text message you must use a UK mobile phone number."
      )
    ).toBeVisible();
    await expect(
      page.getByText(
        "Or you can use an authenticator app to get codes instead."
      )
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Go back to choose authenticator app" })
    ).toBeVisible();
  }
);

Then("I have an option to select Authenticator App", async ({ page }) => {
  await expect(
    page.getByLabel("Authenticator app for smartphone, tablet or computer")
  ).toBeVisible();
});
