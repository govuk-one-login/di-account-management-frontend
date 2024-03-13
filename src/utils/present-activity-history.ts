import { getActivityLogEntry } from "./activityHistory";
import type { ActivityLogEntry } from "./types";

export const presentActivityHistory = async (
  subjectId: string,
  trace: string
): Promise<ActivityLogEntry[]> => {
  const activityLogEntry = await getActivityLogEntry(subjectId, trace);
  if (activityLogEntry) {
    return activityLogEntry;
  } else {
    return [];
  }
};
