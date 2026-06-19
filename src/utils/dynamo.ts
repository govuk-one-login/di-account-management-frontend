import {
  DynamoDBClient,
  GetItemCommand,
  QueryCommand,
  QueryCommandOutput,
  DeleteItemCommand,
  DeleteItemCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBService } from "./types.js";
import { getAWSConfig, AwsConfig } from "../config/aws.js";
import { GetCommandOutput } from "@aws-sdk/lib-dynamodb";

const awsConfig: AwsConfig = getAWSConfig();
export const dynamoClient = new DynamoDBClient(awsConfig as any);

const getItem = async function (
  request: GetItemCommand
): Promise<GetCommandOutput> {
  return await dynamoClient.send(request);
};

const queryItem = async function (
  request: QueryCommand
): Promise<QueryCommandOutput> {
  return await dynamoClient.send(request);
};

const deleteItem = async function (
  request: DeleteItemCommand
): Promise<DeleteItemCommandOutput> {
  return await dynamoClient.send(request);
};

export function dynamoDBService(): DynamoDBService {
  return {
    getItem,
    queryItem,
    deleteItem,
  };
}
