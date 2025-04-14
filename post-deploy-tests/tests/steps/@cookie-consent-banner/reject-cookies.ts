import { createBdd } from "playwright-bdd";

const { Given, Then } = createBdd();

Given("I click to reject cookies", async ({ page }) => {
  await page.getByText("Reject analytics cookies").click();
});

Then("I am shown a message confirming my rejection", async ({ page }) => {
  await page.getByText(
    "You’ve rejected additional cookies. You can change your cookie settings at any time."
  );
});
