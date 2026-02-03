import { getActivityLogEntry } from "./activityHistory.js";
import type { ActivityLogEntry } from "./types.js";

export const presentActivityHistory = async (
  subjectId: string,
  trace: string
): Promise<ActivityLogEntry[]> => {
  const activityLogEntry = await getActivityLogEntry(subjectId, trace);
  if (activityLogEntry) {
    activityLogEntry.sort((first, second) => {
      return second.timestamp - first.timestamp;
    });
    return activityLogEntry;
  } else {
    return [];
  }
};
