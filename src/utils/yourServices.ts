import { DynamoDB } from "aws-sdk";
import { dynamoDBService } from "./dynamo.js";
import {
  getDynamoServiceStoreTableName,
  getAllowedAccountListClientIDs,
  getAllowedServiceListClientIDs,
  hmrcClientIds,
} from "../config.js";
import { prettifyDate } from "./prettifyDate.js";
import type { YourServices, Service } from "./types.js";
import { logger } from "../utils/logger.js";

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
  const hasDetailedCard = hmrcClientIds.includes(service.client_id);
  return {
    client_id: service.client_id,
    count_successful_logins: service.count_successful_logins,
    last_accessed: service.last_accessed,
    last_accessed_readable_format: readable_format_date,
    hasDetailedCard: hasDetailedCard,
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
