import { Request, Response, NextFunction } from "express";
import { hmrcClientIds } from "../config";
import { getServices } from "../utils/yourServices";
import { PATH_DATA } from "../app.constants";
import type { Service } from "../utils/types";

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

export async function checkAllowedServicesList(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (await hasHmrcService(req, res)) {
    next();
  } else {
    res.redirect(PATH_DATA.SECURITY.url);
  }
}
