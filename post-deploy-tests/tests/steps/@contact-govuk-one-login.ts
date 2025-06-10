import { expect, Page, Response } from "@playwright/test";
import { bdd } from "./fixtures";

const { Given, Then, When } = bdd;

let response: Response | null;

const getInlineWebchatButton = ({ page }: { page: Page }) => {
  return page.getByRole("button", { name: "Use webchat" });
};

const getFloatingWebchatButton = ({ page }: { page: Page }) => {
  return page.locator(".sa-chat-tab");
};

Given("I visit the contact page", async ({ page }) => {
  response = await page.goto("/contact-gov-uk-one-login");
});

Then("the page should look expected", async ({ page }) => {
  expect(
    await page.screenshot({
      fullPage: true,
      mask: [page.locator(".contact-reference__code")],
    })
  ).toMatchSnapshot();
});

Then("the page should have status code 200", () => {
  expect(response?.status()).toBe(200);
});

Then(
  "the page should display the expected webchat content",
  async ({ page, $tags }) => {
    await expect(page.getByRole("heading", { name: "Webchat" })).toBeVisible();

    if (!$tags.includes("@nojs")) {
      await expect(
        page.getByText(
          "You can chat live with our support team Monday to Friday, 8am to 8pm UK time."
        )
      ).toBeVisible();
      await expect(getInlineWebchatButton({ page })).toBeVisible();
      await expect(getInlineWebchatButton({ page })).toBeEnabled();
      await expect(getFloatingWebchatButton({ page })).toBeVisible();
      await expect(getFloatingWebchatButton({ page })).toBeEnabled();
    } else {
      // FIXME - this fails because Playwright doesn't think things in
      // noscript tags are visible when JavaScript is disabled. See
      // https://github.com/microsoft/playwright/issues/32542.
      // Hopefully this will be fixed in Playwright and this line can
      // be uncommented.
      // await expect(
      //   page.getByText("You need JavaScript to use webchat.")
      // ).toBeVisible();
      await expect(getInlineWebchatButton({ page })).toHaveCount(0);
      await expect(getFloatingWebchatButton({ page })).toHaveCount(0);
    }
  }
);

Given("webchat has initialised", async ({ page }) => {
  // _sa is added to the window object once webchat is initialised
  // See https://help.smartagent.io/how-to-guides/admin/making-structural-changes/webchat-api/
  await page.waitForFunction(() => !!window._sa);
});

When("I click on the inline webchat button", async ({ page }) => {
  await getInlineWebchatButton({ page }).click();
});

When("I click on the floating webchat button", async ({ page }) => {
  await getFloatingWebchatButton({ page }).click();
});

Then("the webchat appears", async ({ page }) => {
  await expect(page.getByText("GOV.UK One Login webchat · Beta")).toBeVisible();
  await expect(
    page.getByText("Welcome to GOV.UK One Login chatbot support")
  ).toBeVisible();
  await expect(
    page.getByText("Would you like to receive support in English or Welsh?")
  ).toBeVisible();
});

Then("the webchat looks as expected", async ({ page }) => {
  expect(
    await page.screenshot({
      mask: [page.locator(".sa-chat-wrapper .timestamp-container")],
    })
  ).toMatchSnapshot();
});

When("I click on the minimise webchat button", async ({ page }) => {
  await page.getByRole("button", { name: "Minimise chat window" }).click();
});

Then("the webchat disappears", async ({ page }) => {
  await expect(
    page.getByText("GOV.UK One Login webchat · Beta")
  ).not.toBeVisible();
});
