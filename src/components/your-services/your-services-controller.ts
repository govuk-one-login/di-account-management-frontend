import { Request, Response } from "express";
import { presentYourServices } from "../../utils/yourServices";
import { getAppEnv } from "../../config";

export async function yourServicesGet(
  req: Request,
  res: Response
): Promise<void> {
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

    res.render("your-services/index.njk", {
      ...data,
      email: req.session.user.email,
      accountsList: serviceData.accountsList,
      servicesList: serviceData.servicesList,
      hasEnglishOnlyServices,
    });
  } else {
    res.render("your-services/index.njk", data);
  }
}
