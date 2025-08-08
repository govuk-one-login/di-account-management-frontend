import { expect, Page } from "@playwright/test";
import { bdd } from "./fixtures";

const { Given, Then } = bdd;

const getCookieBanner = ({ page }: { page: Page }) => {
  return page.getByLabel("Cookies on GOV.UK One Login");
};

Then("the cookie consent banner shows", ({ page }) => {
  page.getByRole("heading", { name: "Cookies on GOV.UK One Login" });
  page.getByText("We use some essential cookies to make this service work.");
  page.getByText(
    "We'd like to set additional cookies so we can remember your settings, understand how people use the service and make improvements."
  );
});

Then("the cookie consent banner looks as expected", async ({ page }) => {
  expect(await getCookieBanner({ page }).screenshot()).toMatchSnapshot();
});

Given("I click to accept cookies", async ({ page }) => {
  await page.getByText("Accept additional cookies").click();
});

Then("I am shown a message confirming my acceptance", ({ page }) => {
  page.getByText(
    "You've accepted additional cookies. You can change your cookie settings at any time."
  );
});

Then(
  "the message confirming my acceptance looks as expected",
  async ({ page }) => {
    expect(await getCookieBanner({ page }).screenshot()).toMatchSnapshot();
  }
);

Given("I click to reject cookies", async ({ page }) => {
  await page.getByText("Reject additional cookies").click();
});

Then("I am shown a message confirming my rejection", ({ page }) => {
  page.getByText(
    "You've rejected additional cookies. You can change your cookie settings at any time."
  );
});

Then(
  "the message confirming my rejection looks as expected",
  async ({ page }) => {
    expect(await getCookieBanner({ page }).screenshot()).toMatchSnapshot();
  }
);

Then("I can dismiss the confirmation message", async ({ page }) => {
  await page.getByRole("button", { name: "Hide this message" }).click();
  await expect(getCookieBanner({ page })).toBeHidden();
});

Then(
  "the cookie consent banner does not show again when the page is refreshed",
  async ({ page }) => {
    await page.reload();
    await expect(getCookieBanner({ page })).toBeHidden();
  }
);
