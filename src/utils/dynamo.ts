import {
  DynamoDBClient,
  GetItemCommand,
  QueryCommand,
  QueryCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBService } from "./types";
import { getAWSConfig, AwsConfig } from "../config/aws";
import { GetCommandOutput } from "@aws-sdk/lib-dynamodb";

export function dynamoDBService(
  awsConfig: AwsConfig = getAWSConfig()
): DynamoDBService {
  const getItem = async function (
    request: GetItemCommand
  ): Promise<GetCommandOutput> {
    const dynamoClient = new DynamoDBClient(awsConfig as any);
    return await dynamoClient.send(request);
  };

  const queryItem = async function (
    request: QueryCommand
  ): Promise<QueryCommandOutput> {
    const dynamoClient = new DynamoDBClient(awsConfig as any);
    return await dynamoClient.send(request);
  };

  return {
    getItem,
    queryItem,
  };
}
