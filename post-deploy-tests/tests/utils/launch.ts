import { chromium } from "playwright";

export async function launchBrowser() {
  return chromium.launch({ channel: "chrome" });
}
