import * as aws from "aws-sdk";
import { DynamoDBService } from "./types.js";
import { getAWSConfig, AwsConfig } from "../config/aws.js";

export function dynamoDBService(
  awsConfig: AwsConfig = getAWSConfig()
): DynamoDBService {
  const getItem = async function (
    request: aws.DynamoDB.Types.GetItemInput
  ): Promise<aws.DynamoDB.Types.GetItemOutput> {
    const dynamoDb = new aws.DynamoDB(awsConfig);

    return await dynamoDb.getItem(request).promise();
  };

  const queryItem = async function (
    request: aws.DynamoDB.Types.QueryInput
  ): Promise<aws.DynamoDB.Types.QueryOutput> {
    const dynamoDb = new aws.DynamoDB(awsConfig);

    return await dynamoDb.query(request).promise();
  };

  return {
    getItem,
    queryItem,
  };
}
