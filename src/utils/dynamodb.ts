import { Request } from "express";
import {
  DynamoDBClient,
  DescribeTableCommand,
  UpdateTableCommand,
  QueryCommand,
  DeleteItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { getSessionTableName, isLocal } from "../config";
import { subjectSessions } from "./types";
import {
  getLocalDynamoDbBaseUrl,
  getSessionAccessKey,
  getSessionSecretAccessKey,
} from "../config";

const dynamodbConfig = isLocal()
  ? {
      region: "localhost",
      endpoint: getLocalDynamoDbBaseUrl(),
      credentials: {
        accessKeyId: getSessionAccessKey(),
        secretAccessKey: getSessionSecretAccessKey(),
      },
    }
  : {};

export const ddbClient = new DynamoDBClient(dynamodbConfig);

const updateSessionTable = async (tableName: string) => {
  const { Table } = await ddbClient.send(
    new DescribeTableCommand({ TableName: tableName })
  );
  const hasSubjectIdGsi =
    Table.GlobalSecondaryIndexes &&
    Table.GlobalSecondaryIndexes[0].IndexName == "subjectId_index";
  if (!hasSubjectIdGsi) {
    const params = {
      TableName: tableName,
      AttributeDefinitions: [
        {
          AttributeName: "subjectId",
          AttributeType: "S",
        },
      ],
      GlobalSecondaryIndexUpdates: [
        {
          Create: {
            IndexName: "subjectId_index",
            KeySchema: [{ AttributeName: "subjectId", KeyType: "HASH" }],
            Projection: {
              ProjectionType: "KEYS_ONLY",
            },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5,
            },
          },
        },
      ],
    };
    await ddbClient.send(new UpdateTableCommand(params));
  }
};

const waitForTable = async (tableName: string) => {
  const retryInterval = 5000;

  try {
    const { Table } = await ddbClient.send(
      new DescribeTableCommand({ TableName: tableName })
    );
    if (Table.TableStatus !== "ACTIVE") {
      console.log(
        `Table status: ${Table.TableStatus}, retrying in ${retryInterval}ms...`
      );
      return new Promise((resolve) => {
        setTimeout(() => waitForTable(tableName).then(resolve), retryInterval);
      });
    }
  } catch (error) {
    console.warn(
      `Table not found! Error below. Retrying in ${retryInterval} ms...`,
      error
    );

    return new Promise((resolve) => {
      setTimeout(() => waitForTable(tableName).then(resolve), retryInterval);
    });
  }
};

const getSessions = async (subjectId: string): subjectSessions => {
  const params = {
    TableName: getSessionTableName(),
    IndexName: "subjectId_index",
    KeyConditionExpression: "subjectId = :e",
    ExpressionAttributeValues: {
      ":e": { S: subjectId },
    },
  };

  const { Items } = await ddbClient.send(new QueryCommand(params));

  return Items || [];
};

const removeSession = async (sessionId: string): Promise<void> => {
  const params = {
    TableName: getSessionTableName(),
    Key: marshall({ id: sessionId }),
  };

  await ddbClient.send(new DeleteItemCommand(params));

  // dynamodbDocClient
  //   .delete(params)
  //   .promise()
  //   .then(() => {
  //     console.log("successfully deleted session: ", sessionId);
  //   })
  //   .catch((error) => {
  //     console.log(`error: Could not delete session: ${error.stack}`);
  //   });
};

// const purgeOld = (subjectId: string, now: number) => {
//   redisClient.ZREMRANGEBYSCORE(
//     subjectIdKey(subjectId),
//     0,
//     now - getSessionExpiry()
//   );
// };

const updateSubjectId = (req: Request, subjectId: string): void => {
  const params = {
    TableName: getSessionTableName(),
    Key: { id: { S: `sess:${req.session.id}` } },
    UpdateExpression: "set subjectId = :e",
    ExpressionAttributeValues: {
      ":e": {
        S: subjectId,
      },
    },
    ReturnValues: "UPDATED_NEW",
  };

  ddbClient.send(new UpdateItemCommand(params));

  // dynamodb.updateItem(params, (err: any, data: any) => {
  //   if (err) console.log("Update subjectId Error: ", err);
  //   else console.log(data);
  // });
};

export {
  updateSessionTable,
  waitForTable,
  getSessions,
  removeSession,
  updateSubjectId,
};
