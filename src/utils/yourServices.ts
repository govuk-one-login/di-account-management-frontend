import { DynamoDB } from "aws-sdk";
import { dynamoDBService } from "./dynamo";
import {
  getDynamoServiceStoreTableName,
  getAllowedAccountListClientIDs,
  getAllowedServiceListClientIDs,
} from "../config";
import { prettifyDate } from "./prettifyDate";
import type { YourServices, Service } from "./types";
import pino from "pino";

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

export const getServices = async (subjectId: string): Promise<Service[]> => {
  const logger = pino();
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
  const userServices = await getServices(subjectId);
  if (userServices) {
    const userServicesWithPresentableDates = userServices.map((service) =>
      formatService(service)
    );
    return {
      accountsList: userServicesWithPresentableDates.filter((service) =>
        getAllowedAccountListClientIDs.includes(service.client_id)
      ),
      servicesList: userServicesWithPresentableDates.filter((service) =>
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

export const formatService = (service: Service): Service => {
  const readable_format_date = prettifyDate(service.last_accessed);
  return {
    client_id: service.client_id,
    count_successful_logins: service.count_successful_logins,
    last_accessed: service.last_accessed,
    last_accessed_readable_format: readable_format_date,
  };
};

export const containsGovUkPublishingService =  (serviceList: Service[]): boolean => {

  // console.log(Date.now() + " DOUGAL - within govuk service calculation")

  const govUkPublishingClientIds: string[] = [
    "LcueBVCnGZw-YFdTZ4S07XbQx7I",
    "CEr97IZfEPQFgBxq8QNcM8LFxw4",
    "gov-uk"
  ];

    return serviceList.some((service) => {
          return govUkPublishingClientIds.includes(service.client_id);
        }
    )
};