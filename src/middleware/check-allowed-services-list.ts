import { Request, Response, NextFunction } from "express";
import { hmrcClientIds, rsaAllowList } from "../config.js";
import { getServices } from "../utils/yourServices.js";
import { LOG_MESSAGES, PATH_DATA } from "../app.constants.js";
import type { Service } from "../utils/types.js";

const findClientInServices = (
  clientIds: string[],
  services: Service[]
): boolean => {
  return clientIds.some((clientId) => {
    return services.some(({ client_id }) => client_id === clientId);
  });
};
export const hasHmrcService = async (
  req: Request,
  res: Response
): Promise<boolean> => {
  const { user } = req.session;
  const { trace } = res.locals;

  const userServices = await getServices(user.subjectId, trace);
  return userServices && findClientInServices(hmrcClientIds, userServices);
};

export const hasAllowedRSAServices = async (
  req: Request,
  res: Response
): Promise<boolean> => {
  const { user } = req.session;
  const { trace } = res.locals;

  const userServices = await getServices(user.subjectId, trace);
  return userServices && findClientInServices(rsaAllowList, userServices);
};

export async function checkRSAAllowedServicesList(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (await hasAllowedRSAServices(req, res)) {
    next();
  } else {
    req.log.info(
      { trace: res.locals.trace },
      LOG_MESSAGES.ILLEGAL_ATTEMPT_TO_ACCESS_RSA
    );
    res.redirect(PATH_DATA.SECURITY.url);
  }
}
