import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { presentActivityHistory } from "../../../src/utils/present-activity-history.js";
import type { ActivityLogEntry } from "../../../src/utils/types.js";
import * as activityHistoryModule from "../../../src/utils/activityHistory.js";

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
  let getActivityLogEntryStub: ReturnType<typeof vi.fn>;
  const subjectId = "subject-id";
  const trace = "trace";

  beforeEach(() => {
    getActivityLogEntryStub = vi.spyOn(
      activityHistoryModule,
      "getActivityLogEntry"
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an empty list when there is no history", async () => {
    getActivityLogEntryStub.mockResolvedValue([]);

    const history = await presentActivityHistory(subjectId, trace);

    expect(history.length).toBe(0);
  });

  it("returns the history if it exists", async () => {
    getActivityLogEntryStub.mockResolvedValue([
      activityLogEntry,
      activityLogEntry,
    ]);

    const history = await presentActivityHistory(subjectId, trace);

    expect(history.length).toBe(2);
  });

  it("sorts the history in descending order by timestamp", async () => {
    const oldest = activityLogEntry;
    const newest = activityLogEntry;
    newest.timestamp = oldest.timestamp - 1000;

    // oldest first - opposite to what we need
    getActivityLogEntryStub.mockResolvedValue([oldest, newest]);

    const history = await presentActivityHistory(subjectId, trace);

    expect(history.length).toBe(2);
    // expecting newest item first in the list
    expect(history[0].timestamp).toBe(newest.timestamp);
  });
});
