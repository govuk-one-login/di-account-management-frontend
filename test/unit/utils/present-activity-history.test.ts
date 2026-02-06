import { describe } from "mocha";
import { SinonStub, stub } from "sinon";
import { expect } from "chai";

import { presentActivityHistory } from "../../../src/utils/present-activity-history.js";
import type { ActivityLogEntry } from "../../../src/utils/types.js";

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

  it("sorts the history in descending order by timestamp", async () => {
    const oldest = activityLogEntry;
    const newest = activityLogEntry;
    newest.timestamp = oldest.timestamp - 1000;

    // oldest first - opposite to what we need
    getActivityLogEntryStub.resolves([oldest, newest]);

    const history = await presentActivityHistory(subjectId, trace);

    expect(history.length).to.eq(2);
    // expecting newest item first in the list
    expect(history[0].timestamp).to.eq(newest.timestamp);
  });
});
