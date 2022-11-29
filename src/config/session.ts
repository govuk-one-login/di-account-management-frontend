import DynamoDBConnection from "connect-dynamodb";
import session from "express-session";
import { dynamodb } from "./dynamodb";
import { updateSessionTable, waitForTable } from "../utils/dynamodb-queries";
import { getSessionTableName } from "../config";

const DynamoDBStore = DynamoDBConnection(session);

export const getSessionStore = () => {
  const tableName = getSessionTableName();

  const sessionStore = new DynamoDBStore({
    client: dynamodb,
    table: tableName,
  });

  waitForTable(tableName).then(() => {
    updateSessionTable();
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
