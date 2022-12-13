import AWS from "aws-sdk";
import DynamoDBConnection from "connect-dynamodb";
import session from "express-session";
import { updateSessionTable, waitForTable } from "../utils/dynamodb";
import { logger } from "../utils/logger";
import {
  getLocalStackBaseUrl,
  getSessionAccessKey,
  getSessionTableName,
  getSessionSecretAccessKey,
  isLocal,
} from "../config";

const DynamoDBStore = DynamoDBConnection(session);

export const getSessionStore = () => {
  const tableName: string = getSessionTableName();

  const options = isLocal()
    ? {
        AWSConfigJSON: {
          accessKeyId: getSessionAccessKey(),
          secretAccessKey: getSessionSecretAccessKey(),
          region: "eu-west-2",
          endpoint: new AWS.Endpoint(getLocalStackBaseUrl()),
        },
        table: tableName,
      }
    : { AWSRegion: "eu-west-2", table: tableName };

  logger.info(`Connect DynamoDb options: ${options}`);

  const sessionStore = new DynamoDBStore(options);

  waitForTable(tableName).then(async () => {
    try {
      await updateSessionTable(tableName);
    } catch (error) {
      logger.error(error);
    }
  });

  return sessionStore;
};

export function getSessionCookieOptions(
  isProdEnv: boolean,
  expiry: number,
  secret: string
): any {
  return {
    name: "ams",
    secret: secret,
    maxAge: expiry,
    secure: isProdEnv,
  };
}
