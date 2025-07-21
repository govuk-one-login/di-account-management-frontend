import { Request } from "express";
import { AttributeValue, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { dynamoDBService } from "./dynamo";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import {
  getDynamoServiceStoreTableName,
  getListOfAccountClientIDs,
  getListOfServiceClientIDs,
  getIdListFromFilter,
  getClientsWithDetailedCard,
  getAppEnv,
  getListOfShowInDeleteAccountClientIDs,
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

    if (!response["Item"]) {
      return [];
    }

    const services = unmarshallDynamoData(response["Item"])
      .services as Service[];

    return services.map((service) => ({
      ...service,
      isAvailableInWelsh: serviceIsAvailableInWelsh(service.client_id),
    }));
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
      getListOfAccountClientIDs.includes(service.client_id) ||
      getListOfServiceClientIDs.includes(service.client_id)
    ) {
      const formattedService = formatService(service, currentLanguage);
      if (getListOfAccountClientIDs.includes(service.client_id)) {
        accountsList.push(formattedService);
      } else {
        servicesList.push(formattedService);
      }
    }
  });

  const processedData = { accountsList, servicesList };
  return processedData;
};

export const formatService = (
  service: Service,
  currentLanguage?: string
): Service => {
  const readable_format_date = prettifyDate({
    dateEpoch: service.last_accessed,
    locale: currentLanguage,
  });
  const hasDetailedCard = getClientsWithDetailedCard.includes(
    service.client_id
  );

  return {
    client_id: service.client_id,
    count_successful_logins: service.count_successful_logins,
    last_accessed: service.last_accessed,
    last_accessed_readable_format: readable_format_date,
    hasDetailedCard,
    isAvailableInWelsh: service.isAvailableInWelsh,
  };
};

export const getYourServicesForAccountDeletion = async (
  subjectId: string,
  trace: string,
  translate: Request["t"]
) => {
  const userServices = await getServices(subjectId, trace);
  const allowedServices = userServices
    ? userServices.filter((service) =>
        getListOfShowInDeleteAccountClientIDs.includes(service.client_id)
      )
    : [];
  return allowedServices.sort((a, b) => {
    const aName = translate(
      `clientRegistry.${getAppEnv()}.${a.client_id}.header`
    );
    const bName = translate(
      `clientRegistry.${getAppEnv()}.${b.client_id}.header`
    );

    if (aName < bName) {
      return -1;
    }
    if (aName > bName) {
      return 1;
    }
    return 0;
  });
};

export const containsGovUkPublishingService = (
  serviceList: Service[]
): boolean => {
  const govUkPublishingClientIds: string[] = [
    "LcueBVCnGZw-YFdTZ4S07XbQx7I", //pragma: allowlist secret
    "CEr97IZfEPQFgBxq8QNcM8LFxw4", //pragma: allowlist secret
    "gov-uk",
  ];

  return serviceList.some((service) => {
    return govUkPublishingClientIds.includes(service.client_id);
  });
};

export const serviceIsAvailableInWelsh = (serviceId: string): boolean =>
  getIdListFromFilter({ isAvailableInWelsh: true }).includes(serviceId);
