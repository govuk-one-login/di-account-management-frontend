import { Request, Response } from "express";
import { presentYourServices } from "../../utils/yourServices";
import { getAppEnv } from "../../config";

export async function yourServicesGet(
  req: Request,
  res: Response
): Promise<void> {
  const { user } = req.session;
  const env = getAppEnv();
  if (user && user.subjectId) {
    const trace = res.locals.sessionId;
    const serviceData = await presentYourServices(user.subjectId, trace, req.i18n.language);
    const data = {
      email: req.session.user.email,
      accountsList: serviceData.accountsList,
      servicesList: serviceData.servicesList,
      env: env,
    };

    res.render("your-services/index.njk", data);
  } else {
    res.render("your-services/index.njk", { email: user.email, env: env });
  }
}
