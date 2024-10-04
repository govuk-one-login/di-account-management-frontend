import { expect } from "chai";
import request from "supertest";
import express from "express";
import { describe } from "mocha";
import { createApp } from "../../../src/app";
import { PATH_DATA } from "../../../src/app.constants";

let app: express.Application;

before(async () => {
  app = await createApp();
});

describe("App Routes and Middlewares", () => {
  it("should return 200 for /healthcheck route", async () => {
    const res = await request(app).get(PATH_DATA.HEALTHCHECK.url);
    expect(res.status).to.equal(200);
    expect(res.text).to.include("OK");
  });

  // it("should return 404 for non-existent route", async () => {
  //   const res = await request(app).get("/non-existent-route");
  //   expect(res.status).to.equal(404);
  //   expect(res.text).to.include("Page not found");
  // });
});
