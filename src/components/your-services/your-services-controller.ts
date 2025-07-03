import { Request, Response } from "express";
import { presentYourServices } from "../../utils/yourServices";
import { getAppEnv, supportSearchableList } from "../../config";
import { setOplSettings } from "../../utils/opl";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

const defaultContentId = "04566d1b-d791-4e2a-9154-26787fb60516";
const contentIds: Record<string, string> = {
  ACCOUNTS_false_SERVICES_false: "886900f6-178f-41e7-9051-c8428cca86dd",
  ACCOUNTS_true_SERVICES_false: "74c08523-6bce-41da-bcdc-179d5e3784c8",
  ACCOUNTS_true_SERVICES_true: "74c08523-6bce-41da-bcdc-179d5e3784c8",
  ACCOUNTS_false_SERVICES_true: "bfb16754-2768-47c9-a338-21405bc6a98a",
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

    res.render("your-services/index.njk", {
      ...data,
      email: req.session.user.email,
      accountsList: serviceData.accountsList,
      servicesList: serviceData.servicesList,
      hasEnglishOnlyServices,
      searchableListEnabled: supportSearchableList(),
    });
  } else {
    res.render("your-services/index.njk", data);
  }
}
