import { bdd } from "./fixtures";

const { Given } = bdd;

Given("I visit the contact page", async ({ page }) => {
  await page.goto("/contact-gov-uk-one-login", {
    waitUntil: "networkidle",
  });
});
