import AxeBuilder from "@axe-core/playwright";
import { bdd } from "./fixtures";
import { expect } from "@playwright/test";

const { Given, Then } = bdd;

Given("I visit the contact page", async ({ page }) => {
  await page.goto("/contact-gov-uk-one-login", {
    // eslint-disable-next-line playwright/no-networkidle
    waitUntil: "networkidle",
  });
});

Then("the page is accessible", async ({ page }) => {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(["wcag22aa"])
    .analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
