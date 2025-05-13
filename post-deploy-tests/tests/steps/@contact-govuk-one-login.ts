import { expect, Response } from "@playwright/test";
import { bdd } from "./fixtures";

const { Given, Then, When } = bdd;

let response: Response | null;

Given("I visit the contact page", async ({ page }) => {
  response = await page.goto("/contact-gov-uk-one-login");
});

Then("the page should have status code 200", () => {
  expect(response?.status()).toBe(200);
});

Given("webchat has initialised", async ({ page }) => {
  // _sa is added to the window object once webchat is initialised
  // See https://help.smartagent.io/how-to-guides/admin/making-structural-changes/webchat-api/
  await page.waitForFunction(() => !!window._sa);
});

When("I click on the inline webchat button", async ({ page }) => {
  await page.getByRole("button", { name: "Use webchat" }).click();
});

When("I click on the floating webchat button", async ({ page }) => {
  await page.locator(".sa-chat-tab").click();
});

Then("the webchat appears", async ({ page }) => {
  await expect(page.getByText("GOV.UK One Login webchat · Beta")).toBeVisible();
});

When("I click on the minimise webchat button", async ({ page }) => {
  await page.getByRole("button", { name: "Minimise chat window" }).click();
});

Then("the webchat disappears", async ({ page }) => {
  await expect(
    page.getByText("GOV.UK One Login webchat · Beta")
  ).not.toBeVisible();
});
