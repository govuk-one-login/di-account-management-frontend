import type { ConsoleMessage } from "@playwright/test";
import { test as base, createBdd } from "playwright-bdd";
import nock from "nock";

export const test = base.extend<{
  nock: {
    nock: typeof nock;
    methodManagementApi: nock.Scope;
    accountManagementApi: nock.Scope;
  };
}>({
  // biome-ignore lint/correctness/noEmptyPattern: empty object is required to suppress Playwright error "First argument must use the object destructuring pattern"
  nock: async ({}, use) => {
    if (!nock.isActive()) nock.activate();

    await use({
      nock,
      methodManagementApi: nock(
        "http://TODO.com"
        /*TODO new RegExp(
          `^${RegExp.escape("https://method-management-v1-stub.home.dev.account.gov.uk/v1")}|^${RegExp.escape("https://a3bnrbtiga-vpce-0c9ce65be09f99db7.execute-api.eu-west-2.amazonaws.com/staging/v1")}|^${RegExp.escape("https://z7lornzyy5-vpce-0e594accb3d775457.execute-api.eu-west-2.amazonaws.com/integration/v1")}|^${RegExp.escape("https://63qq2dsjo5-vpce-0d7972874707185a0.execute-api.eu-west-2.amazonaws.com/production/v1")}`
        )*/
      ),
      accountManagementApi: nock(
        "http://TODO2.com"
        /*TODO new RegExp(
          `^${RegExp.escape("https://am-stub.home.dev.account.gov.uk")}|^${RegExp.escape("https://manage.staging.account.gov.uk")}|^${RegExp.escape("https://manage.build.account.gov.uk")}|^${RegExp.escape("https://manage.integration.account.gov.uk")}|^${RegExp.escape("https://manage.account.gov.uk")}`
        )*/
      ),
    });

    nock.cleanAll();
  },

  page: async ({ page }, use) => {
    const logs: {
      msg: ConsoleMessage;
      type: string;
      location: string;
    }[] = [];
    page.on("console", (msg) => {
      const location = msg.location();
      logs.push({
        msg,
        type: msg.type(),
        location: `${location.url}:${location.lineNumber}:${location.columnNumber}`,
      });
    });

    const exceptions: Error[] = [];
    page.on("pageerror", (exception) => {
      exceptions.push(exception);
    });

    await use(page);
    // eslint-disable-next-line no-console
    console.log({ "Console logs": logs });
    // eslint-disable-next-line no-console
    console.log({ Exceptions: exceptions });
  },

  javaScriptEnabled: async ({ $tags }, use) => {
    if ($tags.includes("@nojs")) {
      await use(false);
    } else {
      await use(true);
    }
  },
});

export const bdd = createBdd(test);
