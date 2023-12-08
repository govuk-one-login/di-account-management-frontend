import { Request, Response } from "express";
import { getContactEmailServiceUrl } from "../../config";
import { logger } from "../../utils/logger";

export enum ExpectedParams {
  FromURL = "fromURL",
  Theme = "theme",
  AppSessionId = "appSessionId",
  AppErrorCode = "appErrorCode",
}

export const buildContactEmailServiceUrl = (
  req: Request,
  res: Response
): URL => {
  const contactEmailServiceUrl = new URL(getContactEmailServiceUrl());

  for (const paramValue of Object.values(ExpectedParams)) {
    if (
      req.session.queryParameters[
        paramValue as keyof typeof req.session.queryParameters
      ]
    ) {
      contactEmailServiceUrl.searchParams.append(
        paramValue,
        req.session.queryParameters[
          paramValue as keyof typeof req.session.queryParameters
        ]
      );
    } else {
      logger.info(
        { trace: res.locals.sessionId },
        `Missing ${paramValue} in the request or session.`
      );
    }
  }
  return contactEmailServiceUrl;
};
