import { DynamoDB } from "aws-sdk";
import { dynamoDBService } from "./dynamo";
import {
  getDynamoServiceStoreTableName,
  getAllowedAccountListClientIDs,
  getAllowedServiceListClientIDs,
} from "../config";
import { logger } from "./logger";
import type { YourServices, Service } from "./types";

const serviceStoreDynamoDBRequest = (
  subjectId: string
): DynamoDB.Types.GetItemInput => ({
  TableName: getDynamoServiceStoreTableName(),
  Key: {
    user_id: { S: subjectId },
  },
});

const unmarshallDynamoData = (dynamoDBResponse: DynamoDB.Types.AttributeMap) =>
  DynamoDB.Converter.unmarshall(dynamoDBResponse);

const getServiceStoreItem = async (subjectId: string): Promise<Service[]> => {
  try {
    const response = await dynamoDBService().getItem(
      serviceStoreDynamoDBRequest(subjectId)
    );
    return unmarshallDynamoData(response["Item"]).services;
  } catch (err) {
    logger.error(err);
    return [];
  }
};

export const presentYourServices = async (
  subjectId: string
): Promise<YourServices> => {
  const userServices = await getServiceStoreItem(subjectId);
  if (userServices) {
    return {
      accountsList: userServices.filter((service) =>
        getAllowedAccountListClientIDs.includes(service.client_id)
      ),
      servicesList: userServices.filter((service) =>
        getAllowedServiceListClientIDs.includes(service.client_id)
      ),
    };
  } else {
    return {
      accountsList: [],
      servicesList: [],
    };
  }
};
