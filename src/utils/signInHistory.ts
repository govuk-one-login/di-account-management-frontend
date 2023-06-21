import { DynamoDB } from "aws-sdk";
import {
  activityLogItemsPerPage,
  getDynamoActivityLogStoreTableName,
} from "../config";
import { prettifyDate } from "./prettifyDate";
import { ActivityLogEntry, allowedTxmaEvents } from "./types";
import pino from "pino";
import { dynamoDBService } from "./dynamo";

// TODO should be in a config somewhere I suppose.
// Should be generated using Date.now() whenever a launch date is agreed upon
const activityLogLaunchDateInMs = 1685032269060;

export const hasExplanationParagraph = (data: Array<any>) => {
  if (data && data[data.length - 1]) {
    return data[data.length - 1]["timestamp"] < activityLogLaunchDateInMs;
  }
  return false;
};

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

export const formatData = (
  data: ActivityLogEntry[],
  currentPage?: number
): [] => {
  const curr = currentPage || 1;
  const formattedData: any = [];
  const indexStart = (curr - 1) * activityLogItemsPerPage;
  const indexEnd = indexStart + activityLogItemsPerPage;

  // only format and return activity data for the current page
  for (let i = indexStart; i < indexEnd; i++) {
    const newRow: any = {};
    const row = data[i];
    if (!row) break;

    newRow.eventType = allowedTxmaEvents.includes(row.event_type)
      ? "signedIn"
      : null;
    if (!newRow.eventType) continue;

    newRow.time = prettifyDate(Number(row["timestamp"]), {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h12",
      timeZone: "GB",
    });

    newRow.visitedServices =
      row.activities?.length &&
      row.activities.filter((activity: any) =>
        allowedTxmaEvents.includes(activity.type)
      );

    newRow.visitedServicesIds = newRow.visitedServices?.map(
      (obj: any) => obj["client_id"]
    );

    formattedData.push(newRow);
  }

  return formattedData;
};

const activityLogDynamoDBRequest = (
  subjectId: string
): DynamoDB.Types.QueryInput => ({
  TableName: getDynamoActivityLogStoreTableName(),
  KeyConditionExpression: "user_id = :user_id",
  ExpressionAttributeValues: {
    ":user_id": { S: subjectId },
  },
  ScanIndexForward: false, // Set to 'true' for ascending order
});

const getActivityLogEntry = async (
  subjectId: string
): Promise<ActivityLogEntry[]> => {
  const logger = pino();

  try {
    const response = await dynamoDBService().queryItem(
      activityLogDynamoDBRequest(subjectId)
    );
    const unmarshalledItems = response.Items?.map((item) =>
      DynamoDB.Converter.unmarshall(item)
    ) as ActivityLogEntry[];
    return unmarshalledItems;
  } catch (err) {
    logger.error(err);
    return [];
  }
};

export const presentSignInHistory = async (
  subjectId: string
): Promise<ActivityLogEntry[]> => {
  const activityLogEntry:
    | ActivityLogEntry[]
    | PromiseLike<ActivityLogEntry[]>[] = await getActivityLogEntry(subjectId);
  if (activityLogEntry) {
    return activityLogEntry;
  } else {
    return [];
  }
};
