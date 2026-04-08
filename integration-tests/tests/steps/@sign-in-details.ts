import { expect } from "@playwright/test";
import { bdd } from "./fixtures";

const { Then } = bdd;

Then("the option to create a passkey is hidden", async ({ page }) => {
  await expect(page.getByTestId("create-passkey-box")).not.toBeVisible();
});

Then(
  "the passkey appears as 'saved to: provider unknown'",
  async ({ page }) => {
    await expect(page.getByTestId("passkey")).toContainText(
      "Saved to: Provider unknown"
    );
  }
);

Then(
  "there are {int} passkeys in the list",
  async ({ page }, expectedCount: number) => {
    await expect(page.getByTestId("passkey")).toHaveCount(expectedCount);
  }
);
