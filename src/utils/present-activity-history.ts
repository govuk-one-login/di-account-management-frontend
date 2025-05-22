import { getActivityLogEntry } from "./activityHistory";
import type { ActivityLogEntry } from "./types";

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
