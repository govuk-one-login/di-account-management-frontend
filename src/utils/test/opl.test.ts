import { describe, it, expect } from "vitest";
import { setOplSettings } from "../opl.js";
import { Response } from "express";

describe("setOplSettings", () => {
  it("should set res.locals.opl with provided values", () => {
    const res = {
      locals: {},
    } as Response;

    setOplSettings(
      {
        contentId: "test_content_id",
        dynamic: false,
        isPageDataSensitive: true,
        loggedInStatus: false,
        taxonomyLevel1: "test_taxonomy_level1",
        taxonomyLevel2: "test_taxonomy_level2",
        taxonomyLevel3: "test_taxonomy_level3",
      },
      res
    );

    expect(res.locals.opl).toEqual({
      contentId: "test_content_id",
      dynamic: false,
      isPageDataSensitive: true,
      loggedInStatus: false,
      taxonomyLevel1: "test_taxonomy_level1",
      taxonomyLevel2: "test_taxonomy_level2",
      taxonomyLevel3: "test_taxonomy_level3",
    });
  });

  it("should set res.locals.opl with default values", () => {
    const res = {
      locals: {},
    } as Response;

    setOplSettings({}, res);

    expect(res.locals.opl).toEqual({
      contentId: "undefined",
      dynamic: true,
      isPageDataSensitive: false,
      loggedInStatus: true,
      taxonomyLevel1: "accounts",
      taxonomyLevel2: "home",
      taxonomyLevel3: "undefined",
    });
  });
});
