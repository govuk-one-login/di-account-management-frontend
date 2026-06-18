import { Request, Response } from "express";
import { presentYourServices } from "../../utils/yourServices.js";
import {
  getAppEnv,
  supportSearchableList,
  getUserNotificationsTableName,
} from "../../config.js";
import { setOplSettings } from "../../utils/opl.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { GetItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { dynamoDBService } from "../../utils/dynamo.js";
import { AccountKeptNotification } from "../../utils/types.js";
import { logger } from "../../utils/logger.js";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const userNotificationsTableName = getUserNotificationsTableName();
const defaultContentId = "04566d1b-d791-4e2a-9154-26787fb60516";
const contentIds: Record<string, string> = {
  ACCOUNTS_false_SERVICES_false: "886900f6-178f-41e7-9051-c8428cca86dd",
  ACCOUNTS_true_SERVICES_false: "04566d1b-d791-4e2a-9154-26787fb60516",
  ACCOUNTS_true_SERVICES_true: "74c08523-6bce-41da-bcdc-179d5e3784c8",
  ACCOUNTS_false_SERVICES_true: "bfb16754-2768-47c9-a338-21405bc6a98a",
};

const deleteUserNotification = async (subjectId: string) => {
  const dbService = dynamoDBService();

  const commandParams = new DeleteItemCommand({
    TableName: userNotificationsTableName,
    Key: {
      internalCommonSubjectId: { S: subjectId },
    },
  });

  try {
    const response = await dbService.deleteItem(commandParams);
    return response;
  } catch (err) {
    logger.error(`Failed to delete user notification with error: ${err}`);
    throw err;
  }
};

const getUserNotifications = async (
  subjectId: string,
  trace: string
): Promise<AccountKeptNotification> => {
  try {
    const response = await dynamoDBService().getItem(
      userNotificationsTableRequest(subjectId)
    );

    if (!response.Item) {
      return;
    }

    const accountKeptNotification = unmarshall(response.Item);

    return accountKeptNotification as AccountKeptNotification;
  } catch (error) {
    logger.error(
      { trace: trace },
      `User notification table get: failed with ${error}`
    );
    return;
  }
};

const userNotificationsTableRequest = (subjectId: string): GetItemCommand => {
  const param = {
    TableName: userNotificationsTableName,
    Key: {
      internalCommonSubjectId: { S: subjectId },
    },
  };
  return new GetItemCommand(param);
};

export async function yourServicesGet(
  req: Request,
  res: Response
): Promise<void> {
  req.metrics?.addMetric("yourServicesGet", MetricUnit.Count, 1);
  setOplSettings(
    {
      contentId: defaultContentId,
    },
    res
  );

  const { user } = req.session;
  const env = getAppEnv();
  const data = {
    email: user.email,
    env: env,
    currentLngWelsh: req.i18n?.language === "cy",
  };

  if (user?.subjectId) {
    let accountKeptNotification;
    const trace = res.locals.sessionId;
    const serviceData = await presentYourServices(
      user.subjectId,
      trace,
      req.i18n.language
    );
    const hasEnglishOnlyServices =
      serviceData.accountsList.some(
        (service) => service.isAvailableInWelsh === false
      ) ||
      serviceData.servicesList.some(
        (service) => service.isAvailableInWelsh === false
      );

    setOplSettings(
      {
        contentId:
          contentIds[
            `ACCOUNTS_${Boolean(serviceData.accountsList.length)}_SERVICES_${Boolean(serviceData.servicesList.length)}`
          ] ?? defaultContentId,
      },
      res
    );
    if (!user.isActiveAccount) {
      accountKeptNotification = await getUserNotifications(
        user.subjectId,
        trace
      );

      if (accountKeptNotification) {
        await deleteUserNotification(user.subjectId);
      }
      req.session.user.isActiveAccount = true;
    }

    res.render("your-services/index.njk", {
      ...data,
      email: req.session.user.email,
      accountsList: serviceData.accountsList,
      servicesList: serviceData.servicesList,
      hasEnglishOnlyServices,
      searchableListEnabled: supportSearchableList(),
      accountKeptNotification: !!accountKeptNotification,
    });
  } else {
    res.render("your-services/index.njk", data);
  }
}
