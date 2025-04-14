import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, Then } = createBdd();

Given("I visit the contact page", async ({ page }) => {
  await page.goto("/contact-gov-uk-one-login");
});

Then("I can dismiss the confirmation message", async ({ page }) => {
  await page.getByRole("button", { name: "Hide cookie banner button" }).click();
  await expect(
    page.getByLabel("Cookies on GOV.UK One Login")
  ).not.toBeVisible();
});

Then(
  "the cookie consent banner does not show again when the page is refreshed",
  async ({ page }) => {
    await page.reload();
    await expect(
      page.getByLabel("Cookies on GOV.UK One Login")
    ).not.toBeVisible();
  }
);
