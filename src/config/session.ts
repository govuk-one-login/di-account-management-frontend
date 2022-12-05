import DynamoDBConnection from "connect-dynamodb";
import session from "express-session";
import { updateSessionTable, waitForTable } from "../utils/dynamodb";
import {
  getLocalDynamoDbBaseUrl,
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
          region: "localhost",
          endpoint: getLocalDynamoDbBaseUrl(),
        },
        table: tableName,
      }
    : { table: tableName };

  const sessionStore = new DynamoDBStore(options);

  waitForTable(tableName).then(async () => {
    try {
      await updateSessionTable(tableName);
    } catch (error) {
      console.log(error);
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
