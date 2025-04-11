import {
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { defineFeature, loadFeature } from "jest-cucumber";
import { Browser, BrowserContext, Page, Response } from "playwright";
import { launchBrowser } from "../utils/launch";

const feature = loadFeature("./tests/features/contact-govuk-one-login.feature");

const CONTACT_PAGE =
  "https://home.build.account.gov.uk/contact-gov-uk-one-login";

defineFeature(feature, (test) => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  beforeAll(async () => {
    browser = await launchBrowser();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterEach(async () => {
    await context.close();
    await page.close();
  });

  test("Visiting the contact page", async ({ given, then }) => {
    let response: Response;

    given("I visit the contact page", async () => {
      response = await page.goto(CONTACT_PAGE);
    });

    then("the page should have status code 200", () => {
      expect(response.status()).toBe(200);
    });
  });
});
