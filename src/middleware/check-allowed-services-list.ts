import { Request, Response, NextFunction } from "express";
import { getListOfActivityHistoryClientIDs } from "../config";
import { getServices } from "../utils/yourServices";
import { LOG_MESSAGES, PATH_DATA } from "../app.constants";
import type { Service } from "../utils/types";

export const findClientInServices = (
  clientIds: string[],
  services: Service[]
): boolean => {
  return clientIds.some((clientId) => {
    return services.some(({ client_id }) => client_id === clientId);
  });
};

export const hasAllowedActivityLogServices = async (
  req: Request,
  res: Response
): Promise<boolean> => {
  const { user } = req.session;
  const { trace } = res.locals;

  const userServices = await getServices(user.subjectId, trace);
  return (
    userServices &&
    findClientInServices(getListOfActivityHistoryClientIDs, userServices)
  );
};

export async function checkActivityLogAllowedServicesList(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (await hasAllowedActivityLogServices(req, res)) {
    next();
  } else {
    req.log.info(
      { trace: res.locals.trace },
      LOG_MESSAGES.ILLEGAL_ATTEMPT_TO_ACCESS_ACTIVITY_LOG
    );
    res.redirect(PATH_DATA.SECURITY.url);
  }
}

export async function checkRSAAllowedServicesList(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (await hasAllowedActivityLogServices(req, res)) {
    next();
  } else {
    req.log.info(
      { trace: res.locals.trace },
      LOG_MESSAGES.ILLEGAL_ATTEMPT_TO_ACCESS_RSA
    );
    res.redirect(PATH_DATA.SECURITY.url);
  }
}
