import { Request } from "express";
import {
  DynamoDBClient,
  QueryCommand,
  ScalarAttributeType,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { getSessionStoreTableName } from "../config";
import { logger } from "./logger";
import connect_dynamodb from "connect-dynamodb";
import { Store } from "express-session";
import { ERROR_MESSAGES } from "../app.constants";
import { AwsConfig, getAWSConfig } from "../config/aws";

// the value of the USER_IDENTIFIER_IDX_ATTRIBUTE must match the indexed attribute in SessionsDynamoDB table
// defined in `../../deploy/template.yaml`.
const USER_IDENTIFIER_IDX_ATTRIBUTE = "user_id";
const awsConfig: AwsConfig = getAWSConfig();
const dynamoDBCientSessionStore = new DynamoDBClient(awsConfig as any);

const PREFIX = "sess:";

interface SessionStore {
  session: any;
}

let sessionStoreInstance: Store | null = null;

export function getSessionStore({ session }: SessionStore): Store {
  if (!sessionStoreInstance) {
    const DynamoDBStore = connect_dynamodb(session);
    const storeOptions = {
      client: dynamoDBCientSessionStore,
      table: getSessionStoreTableName(),
      specialKeys: [
        { name: USER_IDENTIFIER_IDX_ATTRIBUTE, type: ScalarAttributeType.S },
      ],
      skipThrowMissingSpecialKeys: true,
      prefix: PREFIX,
    };
    sessionStoreInstance = new DynamoDBStore(storeOptions);
  }

  return sessionStoreInstance;
}

async function getSessions(subjectId: string): Promise<string[]> {
  const params = {
    TableName: getSessionStoreTableName(),
    IndexName: "users-sessions",
    KeyConditionExpression: `${USER_IDENTIFIER_IDX_ATTRIBUTE} = :user_identifier`,
    ExpressionAttributeValues: { ":user_identifier": { S: subjectId } },
  };

  try {
    const { Items } = await dynamoDBCientSessionStore.send(
      new QueryCommand(params)
    );
    return (
      Items?.map((session) => {
        const id = unmarshall(session).id;
        return id.startsWith(PREFIX) ? id.substring(PREFIX.length) : id;
      }) || []
    );
  } catch (error) {
    logger.error(
      `Session store: failed to get sessions: ${JSON.stringify(error)}`
    );
    return [];
  }
}

async function deleteAllUserSessionsFromSessionStore(
  subjectId: string,
  sessionStore: Store
) {
  const sessionIds = await getSessions(subjectId);
  const destroySessions = sessionIds.map((sessionId) =>
    Promise.resolve(sessionStore.destroy(sessionId))
  );
  const results = await Promise.allSettled(destroySessions);
  if (results.some((result) => result.status === "rejected")) {
    logger.warn(
      `session-store - failed to delete session(s): ${
        results.filter((result) => result.status === "rejected").length
      } out of ${results.length} failed`
    );
  }
}

export async function deleteExpressSession(req: Request) {
  req.session?.destroy((err) => {
    if (err) {
      logger.error(ERROR_MESSAGES.FAILED_TO_DESTROY_SESSION(err));
    }
  });
}

export async function destroyUserSessions(
  req: Request,
  subjectId: string,
  sessionStore: Store
): Promise<void> {
  try {
    await deleteAllUserSessionsFromSessionStore(subjectId, sessionStore);
  } catch (error: any) {
    logger.error(
      `Session store: failed to delete session(s): ${JSON.stringify(error)}`
    );
  } finally {
    await deleteExpressSession(req);
  }
}
