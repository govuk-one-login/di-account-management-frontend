import { createBdd } from "playwright-bdd";

const { Given, Then } = createBdd();

Given("I click to accept cookies", async ({ page }) => {
  await page.getByText("Accept analytics cookies").click();
});

Then("I am shown a message confirming my acceptance", async ({ page }) => {
  await page.getByText(
    "You’ve accepted additional cookies. You can change your cookie settings at any time."
  );
});
