import AxeBuilder from "@axe-core/playwright";
import { bdd } from "./fixtures";
import { expect } from "@playwright/test";

const { Then, Given } = bdd;

const pageTitleToPath: Record<string, string> = {
  Healthcheck: "/healthcheck",
  Root: "/",
  Security: "/security",
  "Your services": "/your-services",
  "Contact GOV.UK One Login": "/contact-gov-uk-one-login",
  "Services you can use with GOV.UK One Login": "/services-using-one-login",
  "Global logout confirm": "/global-logout/confirm",
};

Then("the page meets our accessibility standards", async ({ page }) => {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(["wcag22aa"])
    .analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

Given("I sign in as the {string} user", async ({ page }, userType: string) => {
  await page.getByRole("button", { name: userType, exact: true }).click();
  await page.waitForURL(pageTitleToPath["Your services"]);
});

Given("I go to the {string} page", async ({ page }, pageTitle: string) => {
  await page.goto(pageTitleToPath[pageTitle]);
});

Given("I click the {string} link", async ({ page }, linkLabel: string) => {
  await page.getByRole("link", { name: linkLabel, exact: true }).click();
});

Given("I click the {string} button", async ({ page }, name: string) => {
  await page.getByRole("button", { name, exact: true }).click();
});

Given("the page has finished loading", async ({ page }) => {
  // eslint-disable-next-line playwright/no-networkidle
  await page.waitForLoadState("networkidle");
});

Given("I accept cookies", async ({ page }) => {
  await page
    .getByRole("button", {
      name: "Accept additional cookies",
    })
    .click();
  await page.getByRole("button", { name: "Hide this message" }).click();
});

Given(
  "I enter and submit my password {string}",
  async ({ page }, password: string) => {
    await page.getByLabel("Enter your password").fill(password);
    await page.getByRole("button", { name: "Continue" }).click();
  }
);

Then(
  "the page title is prefixed with {string}",
  async ({ page }, pageTitle: string) => {
    expect(await page.title()).toBe(`${pageTitle} - GOV.UK One Login`);
  }
);

Then("the page title is {string}", async ({ page }, pageTitle: string) => {
  expect(await page.title()).toBe(pageTitle);
});

Then("I am on the sign in page", async ({ page }) => {
  await expect(
    page.getByText("API Simulation Tool", { exact: true })
  ).toBeVisible();
});

Then("the page looks as expected", async ({ page }) => {
  expect(
    await page.screenshot({
      fullPage: true,
      mask: [page.locator(".contact-reference__code")],
    })
  ).toMatchSnapshot();
});
