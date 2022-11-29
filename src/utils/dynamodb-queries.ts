import { dynamodb, dynamodbDocClient } from "../config/dynamodb";
import { getSessionTableName } from "../config";
import { SubjectSessionIndexService } from "./types";

export const updateSessionTable = () => {
  const params = {
    TableName: getSessionTableName(),
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
  dynamodb.updateTable(params, (err: any, data: any) => {
    if (err) console.log("GSI create Error: ", err);
    else console.log(data);
  });
};

const retryInterval = 5000;

export const waitForTable = (tableName) =>
  dynamodb
    .describeTable({ TableName: tableName })
    .promise()
    .then((data) => {
      if (data.Table.TableStatus !== "ACTIVE") {
        console.log(
          `Table status: ${data.Table.TableStatus}, retrying in ${retryInterval}ms...`
        );
        return new Promise((resolve) => {
          setTimeout(
            () => waitForTable(tableName).then(resolve),
            retryInterval
          );
        });
      } else {
        return;
      }
    })
    .catch((error) => {
      console.warn(
        `Table not found! Error below. Retrying in ${retryInterval} ms...`,
        error
      );

      return new Promise((resolve) => {
        setTimeout(() => waitForTable(tableName).then(resolve), retryInterval);
      });
    });

export function subjectSessionIndex(): SubjectSessionIndexService {
  const getSessions = async (subjectId: string) => {
    const params = {
      TableName: getSessionTableName(),
      IndexName: "subjectId_index",
      KeyConditionExpression: "subjectId = :e",
      ExpressionAttributeValues: {
        ":e": subjectId,
      },
    };

    const sessions = await dynamodbDocClient
      .query(params)
      .promise()
      .then((data) => {
        console.log("successfully retrieved sessions");
        return data;
      })
      .catch((error) => {
        console.log(`error: Could not query: ${error.stack}`);
      });

    return sessions.Items;
  };

  const removeSession = (sessionId: string): void => {
    const params = {
      TableName: getSessionTableName(),
      Key: { id: sessionId },
    };

    dynamodbDocClient
      .delete(params)
      .promise()
      .then(() => {
        console.log("successfully deleted session: ", sessionId);
      })
      .catch((error) => {
        console.log(`error: Could not delete session: ${error.stack}`);
      });
  };

  // const purgeOld = (subjectId: string, now: number) => {
  //   redisClient.ZREMRANGEBYSCORE(
  //     subjectIdKey(subjectId),
  //     0,
  //     now - getSessionExpiry()
  //   );
  // };

  return {
    getSessions,
    removeSession,
  };
}

export const updateSubjectId = (req, subjectId) => {
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

  dynamodb.updateItem(params, (err: any, data: any) => {
    if (err) console.log("Update subjectId Error: ", err);
    else console.log(data);
  });
};
