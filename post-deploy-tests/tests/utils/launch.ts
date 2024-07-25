import { launch, Browser } from "puppeteer";

export async function launchBrowser(): Promise<Browser> {
  return launch({
    headless: true,
    defaultViewport: null,
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox"],
  });
}
