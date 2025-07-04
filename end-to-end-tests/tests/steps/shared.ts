import AxeBuilder from "@axe-core/playwright";
import { bdd } from "./fixtures";
import { expect, Page } from "@playwright/test";

const { Then } = bdd;

export const acceptCookies = async ({
  page,
  javaScriptEnabled,
}: {
  page: Page;
  javaScriptEnabled: boolean;
}) => {
  if (javaScriptEnabled) {
    await page.getByText("Accept analytics cookies").click();
    await page.getByRole("button", { name: "Hide this message" }).click();
  }
};

export const visitContactPage = async ({
  page,
  javaScriptEnabled,
  acceptCookies: acceptCookiesArg = true,
}: {
  page: Page;
  javaScriptEnabled: boolean;
  acceptCookies?: boolean;
}) => {
  await page.goto("/contact-gov-uk-one-login", {
    // eslint-disable-next-line playwright/no-networkidle
    waitUntil: "networkidle",
  });
  if (acceptCookiesArg) {
    await acceptCookies({ page, javaScriptEnabled });
  }
};

Then("the page is accessible", async ({ page }) => {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(["wcag22aa"])
    .analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
