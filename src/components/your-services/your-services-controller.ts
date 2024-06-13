import { Request, Response } from "express";
import { presentYourServices } from "../../utils/yourServices.js";
import { getAppEnv } from "../../config.js";

export async function yourServicesGet(
  req: Request,
  res: Response
): Promise<void> {
  const { user } = req.session;
  const env = getAppEnv();
  let data;

  if (user && user.subjectId) {
    const trace = res.locals.sessionId;
    const serviceData = await presentYourServices(
      user.subjectId,
      trace,
      req.i18n.language
    );
    data = {
      email: req.session.user.email,
      accountsList: serviceData.accountsList,
      servicesList: serviceData.servicesList,
      env: env,
    };
  } else {
    data = { email: user.email, env: env };
  }
  res.render("your-services/index.njk", data);
}
