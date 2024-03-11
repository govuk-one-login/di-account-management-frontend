import { DynamoDB } from "aws-sdk";
import {
  activityLogItemsPerPage,
  getDynamoActivityLogStoreTableName,
} from "../config";
import { prettifyDate } from "./prettifyDate";
import {
  ActivityLogEntry,
  allowedTxmaEvents,
  FormattedActivityLog,
} from "./types";
import { dynamoDBService } from "./dynamo";
import { decryptData } from "./decrypt-data";
import { PATH_DATA } from "../app.constants";
import { logger } from "./logger";

export const generatePagination = (dataLength: number, page: any): [] => {
  const pagination: any = {
    currentPage: 1,
  };
  const totalPages = Math.ceil(dataLength / activityLogItemsPerPage);
  const pageParam = page && Number(page);
  let currentPage = 1;

  // currentPage will default to 1 unless
  // - the number of events exceeds the maximum number allowed per page
  // - a valid "page" query string parameter is detected
  if (dataLength > activityLogItemsPerPage) {
    const lastPage = Math.ceil(dataLength / activityLogItemsPerPage);
    if (
      pageParam &&
      Number.isInteger(pageParam) &&
      pageParam <= lastPage &&
      pageParam >= 1
    ) {
      currentPage = pageParam;
    }
  }

  // don't display pagination unless there are at least 2 pages worth of activity
  if (totalPages == 1) return pagination;

  pagination.lastPage = totalPages;
  pagination.currentPage = currentPage;
  pagination.items = Array.from(
    { length: pagination.lastPage },
    (value, index) => index + 1
  );

  switch (pagination.currentPage) {
    // a min of 2, max of 3 numbered links are always visible in the pagination component
    case 1:
      // if the current page is 1, display the "active" page link first
      //  e.g 1️⃣ 2 3 Next page ➡️
      pagination.firstThree = [
        pagination.currentPage,
        pagination.currentPage + 1,
        pagination.currentPage + 2,
      ];
      pagination.items = pagination.items.filter((value: any) =>
        pagination.firstThree.includes(value)
      );
      // don't display a "previous" link as there would be no previous page
      pagination.nextPage = pagination.currentPage + 1;
      break;
    case pagination.lastPage:
      // if the current page is the last page, display the "active" page link last
      // e.g ⬅️ Previous page 1️ 2️ 3️⃣
      pagination.lastThree = [
        pagination.currentPage - 2,
        pagination.currentPage - 1,
        pagination.currentPage,
      ];
      pagination.items = pagination.items.filter((value: any) =>
        pagination.lastThree.includes(value)
      );
      // there wouldn't be a "next" page link as this is the last page
      pagination.previousPage = pagination.currentPage - 1;
      break;
    default:
      // e.g. ⬅️ Previous page 1️ 2️⃣ 3 Next page ➡️
      pagination.items = [
        pagination.currentPage - 1,
        pagination.currentPage,
        pagination.currentPage + 1,
      ];
      pagination.previousPage = pagination.currentPage - 1;
      pagination.nextPage = pagination.currentPage + 1;
      break;
  }

  return pagination;
};

export const formatActivityLog = (
  activityLogEntry: ActivityLogEntry,
  trace: string,
  currentLanguage?: string,
  pageNumber?: number
): FormattedActivityLog => {
  const formattedActivityLog: FormattedActivityLog = {} as FormattedActivityLog;
  formattedActivityLog.eventType = allowedTxmaEvents.includes(
    activityLogEntry.event_type
  )
    ? "signedIn"
    : null;

  if (!formattedActivityLog.eventType) {
    logger.debug(
      { trace: trace },
      `Ignoring activity log as event type ${formattedActivityLog.eventType} is not displayed by Activity history.`
    );
    return;
  }

  formattedActivityLog.eventId = activityLogEntry.event_id;
  formattedActivityLog.sessionId = activityLogEntry.session_id;
  formattedActivityLog.clientId = activityLogEntry.client_id;
  formattedActivityLog.reportedSuspicious =
    activityLogEntry.reported_suspicious;
  formattedActivityLog.reportSuspiciousActivityUrl = `${PATH_DATA.REPORT_SUSPICIOUS_ACTIVITY.url}?event=${activityLogEntry.event_id}&page=${pageNumber || 1}`;

  formattedActivityLog.time = prettifyDate({
    dateEpoch: Number(activityLogEntry["timestamp"]),
    options: {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h12",
      timeZone: "GB",
    },
    locale: currentLanguage,
  });

  formattedActivityLog.visitedService = activityLogEntry.client_id;
  formattedActivityLog.visitedServiceId = activityLogEntry.client_id;
  formattedActivityLog.reportNumber = activityLogEntry.zendesk_ticket_number;

  if (activityLogEntry["reported_suspicious_time"]) {
    formattedActivityLog.reportedSuspiciousTime = prettifyDate({
      dateEpoch: Number(activityLogEntry["reported_suspicious_time"]),
      options: {
        month: "long",
        day: "numeric",
        year: "numeric",
      },
    });
  }

  return formattedActivityLog;
};

export const formatActivityLogs = (
  activityLogEntries: ActivityLogEntry[],
  trace: string,
  currentPage?: number,
  currentLanguage?: string
): FormattedActivityLog[] => {
  const curr = currentPage || 1;
  const formattedData: FormattedActivityLog[] = [];
  const indexStart = (curr - 1) * activityLogItemsPerPage;
  const indexEnd = indexStart + activityLogItemsPerPage;

  // only format and return activity data for the current page
  for (let i = indexStart; i < indexEnd; i++) {
    if (!activityLogEntries[i]) break;
    const row: FormattedActivityLog = formatActivityLog(
      activityLogEntries[i],
      trace,
      currentLanguage,
      currentPage
    );
    if (row) formattedData.push(row);
  }
  return formattedData;
};

const activityLogDynamoDBRequest = (
  user_id: string
): DynamoDB.Types.QueryInput => ({
  TableName: getDynamoActivityLogStoreTableName(),
  KeyConditionExpression: "user_id = :user_id",
  ExpressionAttributeValues: {
    ":user_id": { S: user_id },
  },
  ScanIndexForward: false, // Set to 'true' for ascending order
});

const getActivityLogEntry = async (
  user_id: string,
  trace: string
): Promise<ActivityLogEntry[]> => {
  try {
    const response = await dynamoDBService().queryItem(
      activityLogDynamoDBRequest(user_id)
    );
    const unmarshalledItems = response.Items?.map((item) =>
      DynamoDB.Converter.unmarshall(item)
    ) as ActivityLogEntry[];
    return unmarshalledItems;
  } catch (err) {
    logger.error(
      { trace: trace },
      `Failed to retrieve from dynamodb ${err.message}`
    );
    return [];
  }
};

export async function filterAndDecryptActivity(
  activityLogs: ActivityLogEntry[],
  trace: string
): Promise<ActivityLogEntry[]> {
  const filteredActivityLogs: ActivityLogEntry[] = [];

  for (const activityLog of activityLogs) {
    if (!activityLog.user_id || !activityLog.event_type) {
      continue;
    }
    let eventType = activityLog.event_type;

    eventType = await decryptData(
      activityLog.event_type,
      activityLog.user_id,
      trace
    );

    if (allowedTxmaEvents.includes(eventType)) {
      filteredActivityLogs.push({ ...activityLog, event_type: eventType });
    }
  }

  return filteredActivityLogs;
}

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
