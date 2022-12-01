import AWS from "aws-sdk";
import { getNodeEnv } from "../config";
import { ENVIRONMENT_NAME } from "../app.constants";
import {
  getAwsRegion,
  getLocalDynamoDbBaseUrl,
  getSessionAccessKey,
  getSessionSecretAccessKey,
} from "../config";

const isProduction = getNodeEnv() === ENVIRONMENT_NAME.PROD;

const awsConfig = {
  accessKeyId: getSessionAccessKey(),
  secretAccessKey: getSessionSecretAccessKey(),
};

if (!isProduction) {
  AWS.config.update(awsConfig);
}

const sessionConfig = isProduction
  ? {}
  : {
      region: "localhost",
      endpoint: getLocalDynamoDbBaseUrl(),
    };

export const dynamodb = new AWS.DynamoDB(sessionConfig);
export const dynamodbDocClient = new AWS.DynamoDB.DocumentClient(sessionConfig);
