import { expect } from "@playwright/test";
import { bdd } from "./fixtures";

const { Given, Then } = bdd;

Given("I visit the contact page", async ({ page }) => {
  await page.goto("/contact-gov-uk-one-login");
});

Then("the cookie consent banner shows", async ({ page }) => {
  await page.getByRole("heading", { name: "Cookies on GOV.UK One Login" });
  await page.getByText(
    "We use some essential cookies to make this service work."
  );
  await page.getByText(
    "We’d also like to use analytics cookies so we can understand how you use the service and make improvements."
  );
  expect(await page.screenshot()).toMatchSnapshot();
});

Given("I click to accept cookies", async ({ page }) => {
  await page.getByText("Accept analytics cookies").click();
});

Then("I am shown a message confirming my acceptance", async ({ page }) => {
  await page.getByText(
    "You’ve accepted additional cookies. You can change your cookie settings at any time."
  );
  expect(await page.screenshot()).toMatchSnapshot();
});

Given("I click to reject cookies", async ({ page }) => {
  await page.getByText("Reject analytics cookies").click();
});

Then("I am shown a message confirming my rejection", async ({ page }) => {
  await page.getByText(
    "You’ve rejected additional cookies. You can change your cookie settings at any time."
  );
  expect(await page.screenshot()).toMatchSnapshot();
});

Then("I can dismiss the confirmation message", async ({ page }) => {
  await page.getByRole("button", { name: "Hide this message" }).click();
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
