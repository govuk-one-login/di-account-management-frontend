import {
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { defineFeature, loadFeature } from "jest-cucumber";
import { launch, Page, Browser, HTTPResponse } from "puppeteer";

const feature = loadFeature("./tests/features/contact-govuk-one-login.feature");

const CONTACT_PAGE =
  "https://home.build.account.gov.uk/contact-gov-uk-one-login";

defineFeature(feature, (test) => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  test("Visiting the contact page", async ({ given, then }) => {
    let response: HTTPResponse;

    given("I visit the contact page", async () => {
      response = await page.goto(CONTACT_PAGE);
    });

    then("the page should have status code 200", () => {
      expect(response.status()).toBe(200);
    });
  });
});
