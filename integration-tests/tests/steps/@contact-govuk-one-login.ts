import { expect, type Page } from "@playwright/test";
import { bdd } from "./fixtures";

const { Then, When } = bdd;

const getInlineWebchatButton = ({ page }: { page: Page }) => {
  return page.getByRole("button", { name: "Use webchat" });
};

const getFloatingWebchatButton = ({ page }: { page: Page }) => {
  return page.locator(".sa-chat-tab");
};

Then(
  "the page displays the expected webchat content",
  async ({ page, javaScriptEnabled }) => {
    await expect(page.getByRole("heading", { name: "Webchat" })).toBeVisible();

    if (javaScriptEnabled) {
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
  ).toBeVisible({ timeout: 10000 });
  await expect(
    page.getByText("Would you like to receive support in English or Welsh?")
  ).toBeVisible();
});

When("I click on the minimise webchat button", async ({ page }) => {
  await page.getByRole("button", { name: "Minimise chat window" }).click();
});

Then("the webchat disappears", async ({ page }) => {
  await expect(page.getByText("GOV.UK One Login webchat · Beta")).toBeHidden();
});
