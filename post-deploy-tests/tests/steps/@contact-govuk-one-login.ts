import { expect, Response } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, Then } = createBdd();

let response: Response;

const CONTACT_PAGE = "/contact-gov-uk-one-login";

Given("I visit the contact page", async ({ page }) => {
  response = await page.goto(CONTACT_PAGE);
});

Then("the page should have status code 200", () => {
  expect(response.status()).toBe(200);
});
