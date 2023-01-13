import { DynamoDB } from "aws-sdk";
import { DynamoDBService } from "./types";
import { getAWSConfig, AwsConfig } from "../config/aws";

export function dynamoDBService(awsConfig: AwsConfig = getAWSConfig()): DynamoDBService {
  const getItem = async function (
    request: DynamoDB.Types.GetItemInput
  ): Promise<DynamoDB.Types.GetItemOutput> {
    const dynamoDb = new DynamoDB(awsConfig);

    return await dynamoDb.getItem(request).promise();
  };

  return {
    getItem,
  };
}
