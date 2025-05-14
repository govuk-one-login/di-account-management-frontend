import { ConsoleMessage } from "@playwright/test";
import { createBdd, test as base } from "playwright-bdd";

export const test = base.extend({
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
