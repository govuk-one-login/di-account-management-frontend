import { Application } from "express";
import request from "supertest";
import { expect } from "vitest";

export async function checkFailedCSRFValidationBehaviour(
  app: Application,
  url: string,
  payload: Record<string, any>
): Promise<void> {
  const response = await request(app)
    .post(url)
    .type("form")
    .send(payload)
    .expect(302);
  expect(response.header.location).toBe("/your-services");
}
