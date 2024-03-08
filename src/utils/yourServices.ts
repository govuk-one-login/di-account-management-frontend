import { DynamoDB } from "aws-sdk";
import { dynamoDBService } from "./dynamo";
import {
  getDynamoServiceStoreTableName,
  getAllowedAccountListClientIDs,
  getAllowedServiceListClientIDs,
  hmrcClientIds,
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

export const getServices = async (
  subjectId: string,
  trace: string
): Promise<Service[]> => {
  const logger = pino();
  try {
    const response = await dynamoDBService().getItem(
      serviceStoreDynamoDBRequest(subjectId)
    );
    return unmarshallDynamoData(response["Item"]).services;
  } catch (err) {
    logger.error({ trace: trace }, err);
    return [];
  }
};

export const presentYourServices = async (
  subjectId: string,
  trace: string,
  currentLanguage?: string
): Promise<YourServices> => {
  const userServices = await getServices(subjectId, trace);
  if (userServices) {
    const userServicesWithPresentableDates = userServices.map((service) =>
      formatService(service, currentLanguage)
    );
    return {
      accountsList: filterServicesBasedOnClientIDs(
        userServicesWithPresentableDates,
        getAllowedAccountListClientIDs
      ),
      servicesList: filterServicesBasedOnClientIDs(
        userServicesWithPresentableDates,
        getAllowedServiceListClientIDs
      ),
    };
  } else {
    return {
      accountsList: [],
      servicesList: [],
    };
  }
};

const filterServicesBasedOnClientIDs = (
  services: Service[],
  clientIDs: string[]
): Service[] => {
  return services.filter(({ client_id }) => clientIDs.includes(client_id));
};

export const getAllowedListServices = async (
  subjectId: string,
  trace: string
): Promise<Service[]> => {
  const userServices = await getServices(subjectId, trace);
  if (userServices) {
    return userServices.filter((service) => {
      return (
        getAllowedAccountListClientIDs.includes(service.client_id) ||
        getAllowedServiceListClientIDs.includes(service.client_id)
      );
    });
  } else {
    return [];
  }
};

export const formatService = (
  service: Service,
  currentLanguage?: string
): Service => {
  const readable_format_date = prettifyDate({
    dateEpoch: service.last_accessed,
    locale: currentLanguage,
  });
  const isHMRC = hmrcClientIds.includes(service.client_id);
  return {
    client_id: service.client_id,
    count_successful_logins: service.count_successful_logins,
    last_accessed: service.last_accessed,
    last_accessed_readable_format: readable_format_date,
    isHMRC: isHMRC,
  };
};

export const containsGovUkPublishingService = (
  serviceList: Service[]
): boolean => {
  const govUkPublishingClientIds: string[] = [
    "LcueBVCnGZw-YFdTZ4S07XbQx7I",
    "CEr97IZfEPQFgBxq8QNcM8LFxw4",
    "gov-uk",
  ];

  return serviceList.some((service) => {
    return govUkPublishingClientIds.includes(service.client_id);
  });
};
