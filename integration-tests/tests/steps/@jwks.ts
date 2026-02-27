import { bdd } from "./fixtures";
import { expect } from "@playwright/test";
import { APIResponse } from "@playwright/test";

const { When, Then } = bdd;

let lastResponse: APIResponse | null = null;

When("I open the url {string}", async ({ request }, path: string) => {
  lastResponse = await request.get(path);
  expect(lastResponse).not.toBeNull();
});

Then("the response status code should be {int}", ({}, statusCode: number) => {
  expect(lastResponse?.status()).toBe(statusCode);
});

Then("the response should be valid JSON", async ({}) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const json = await lastResponse?.json();
  expect(json).toBeDefined();
});

Then("the response should contain a {string} array", async ({}, key: string) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const json = await lastResponse?.json();
  expect(json).toBeDefined();
   
  expect(json).toHaveProperty(key);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(Array.isArray(json[key])).toBe(true);
});

Then("each key should have a {string} field with value {string}", async ({}, field: string, value: string) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const json = await lastResponse?.json();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const keys = json.keys;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  keys.forEach((key: Record<string, unknown>) => {
     
    expect(key[field]).toBe(value);
  });
});

Then("each key should have a {string} field", async ({}, field: string) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const json = await lastResponse?.json();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const keys = json.keys;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  keys.forEach((key: Record<string, unknown>) => {
    expect(key).toHaveProperty(field);
     
    expect(typeof key[field]).toBe("string");
  });
});

Then("the response should have cache control header {string}", ({}, headerValue: string) => {
  const cacheControl = lastResponse?.headers()["cache-control"];
  expect(cacheControl).toBe(headerValue);
});
