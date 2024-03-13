import { describe } from "mocha";
import { SinonStub, stub } from "sinon";
import { expect } from "chai";

import { presentActivityHistory } from "../../../src/utils/present-activity-history";
import type { ActivityLogEntry } from "../../../src/utils/types";

const activityLogEntry: ActivityLogEntry = {
  event_type: "AUTH_AUTH_CODE_ISSUED",
  session_id: "asdf",
  user_id: "1234",
  timestamp: 1689210000,
  client_id: "dontshowme",
  event_id: "12345",
  reported_suspicious: false,
  truncated: false,
};

describe("presentActivityHistory", () => {
  let getActivityLogEntryStub: SinonStub;
  const subjectId = "subject-id";
  const trace = "trace";

  const activityHistoryModule = require("../../../src/utils/activityHistory");
  beforeEach(() => {
    getActivityLogEntryStub = stub(
      activityHistoryModule,
      "getActivityLogEntry"
    );
  });

  afterEach(() => {
    getActivityLogEntryStub.restore();
  });
  it("returns an empty list when there is no history", async () => {
    getActivityLogEntryStub.resolves([]);

    const history = await presentActivityHistory(subjectId, trace);

    expect(history.length).to.eq(0);
  });

  it("returns the history if it exists", async () => {
    getActivityLogEntryStub.resolves([activityLogEntry, activityLogEntry]);

    const history = await presentActivityHistory(subjectId, trace);

    expect(history.length).to.eq(2);
  });
});
