import { AttributeValue, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { dynamoDBService } from "./dynamo";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import {
  getDynamoServiceStoreTableName,
  getAllowedAccountListClientIDs,
  getAllowedServiceListClientIDs,
  hmrcClientIds,
} from "../config";
import { prettifyDate } from "./prettifyDate";
import type { YourServices, Service } from "./types";
import { logger } from "./logger";

const serviceStoreDynamoDBRequest = (subjectId: string): GetItemCommand => {
  const param = {
    TableName: getDynamoServiceStoreTableName(),
    Key: {
      user_id: { S: subjectId },
    },
  };
  return new GetItemCommand(param);
};

const unmarshallDynamoData = (
  dynamoDBResponse: Record<string, AttributeValue>
) => unmarshall(dynamoDBResponse);

export const getServices = async (
  subjectId: string,
  trace: string
): Promise<Service[]> => {
  try {
    const response = await dynamoDBService().getItem(
      serviceStoreDynamoDBRequest(subjectId)
    );
    const services = unmarshallDynamoData(response["Item"]).services;
    return services;
  } catch (error) {
    logger.error({ trace: trace }, `Your Services: failed with ${error}`);
    return [];
  }
};

export const presentYourServices = async (
  subjectId: string,
  trace: string,
  currentLanguage?: string
): Promise<YourServices> => {
  const userServices = await getServices(subjectId, trace);
  const accountsList: Service[] = [];
  const servicesList: Service[] = [];

  userServices.forEach((service) => {
    if (
      getAllowedAccountListClientIDs.includes(service.client_id) ||
      getAllowedServiceListClientIDs.includes(service.client_id)
    ) {
      const formattedService = formatService(service, currentLanguage);
      if (getAllowedAccountListClientIDs.includes(service.client_id)) {
        accountsList.push(formattedService);
      } else {
        servicesList.push(formattedService);
      }
    }
  });

  const processedData = { accountsList, servicesList };
  return processedData;
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
