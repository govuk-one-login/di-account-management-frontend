import {
  DynamoDBClient,
  QueryCommand,
  DynamoDBClientConfig,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { getSessionStoreTableName } from "../config";
import { getDBConfig } from "../config/aws";
import { logger } from "./logger";
import connect_dynamodb from "connect-dynamodb";
import { DynamoDB } from "aws-sdk";
import { ClientConfiguration } from "aws-sdk/clients/dynamodb";
import { Store } from "express-session";

// the value of the USER_IDENTIFIER_IDX_ATTRIBUTE must match the indexed attribute in SessionsDynamoDB table
// defined in `../../deploy/template.yaml`.
const USER_IDENTIFIER_IDX_ATTRIBUTE = "user_id";

const PREFIX = "sess:";
const ddbClient = new DynamoDBClient(getDBConfig() as DynamoDBClientConfig);

interface SessionStore {
  session: any;
}

export function getSessionStore({ session }: SessionStore): Store {
  const DynamoDBStore = connect_dynamodb(session);
  const storeOptions = {
    client: new DynamoDB(getDBConfig() as ClientConfiguration),
    table: getSessionStoreTableName(),
    specialKeys: [{ name: USER_IDENTIFIER_IDX_ATTRIBUTE, type: "S" }],
    skipThrowMissingSpecialKeys: true,
    prefix: PREFIX,
  };
  return new DynamoDBStore(storeOptions);
}

async function getSessions(subjectId: string): Promise<string[]> {
  const params = {
    TableName: getSessionStoreTableName(),
    IndexName: "users-sessions",
    KeyConditionExpression: `${USER_IDENTIFIER_IDX_ATTRIBUTE} = :user_identifier`,
    ExpressionAttributeValues: { ":user_identifier": { S: subjectId } },
  };

  try {
    const { Items } = await ddbClient.send(new QueryCommand(params));
    if (!Items || Items.length < 1) return [];
    return Items.map((session) => {
      const id = unmarshall(session).id;
      return id.startsWith(PREFIX) ? id.substring(PREFIX.length) : id;
    });
  } catch (error) {
    logger.error(
      `session-store - failed to get sessions: ${JSON.stringify(error)}`
    );
  }
  return [];
}

export async function destroyUserSessions(
  subjectId: string,
  sessionStore: Store
): Promise<void> {
  const sessionIds = await getSessions(subjectId);
  const destroySessions = sessionIds.map((sessionId) =>
    Promise.resolve(sessionStore.destroy(sessionId))
  );
  try {
    const results = await Promise.allSettled(destroySessions);
    if (results.some((result) => result.status === "rejected")) {
      logger.warn(
        `session-store - failed to delete session(s): ${
          results.filter((result) => result.status === "rejected").length
        } out of ${results.length} failed`
      );
    }
  } catch (error: any) {
    logger.error(
      `session-store - failed to delete session(s): ${JSON.stringify(error)}`
    );
  }
}
