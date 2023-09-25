import { DynamoDB } from "aws-sdk";
import pino from "pino";
import { dynamoDBService } from "./../utils/dynamo";
import { getDynamoActivityLogStoreTableName } from "../config";
import { ActivityLogEntry, EncryptedActivityLogEntry } from "../utils/types";
import { decryptActivityLogEntry } from "../utils/signInHistory";

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

export const getActivityLog = async (
  subjectId: string
): Promise<ActivityLogEntry[]> => {
  const logger = pino();
  try {
    const response = await dynamoDBService().queryItem(
      activityLogDynamoDBRequest(subjectId)
    );
    const unmarshalledItems = response.Items?.map((item) =>
      DynamoDB.Converter.unmarshall(item)
    ) as EncryptedActivityLogEntry[];
    return Promise.all(
      unmarshalledItems.map((item) => decryptActivityLogEntry(subjectId, item))
    );
  } catch (err) {
    logger.error(err);
    return [];
  }
};
