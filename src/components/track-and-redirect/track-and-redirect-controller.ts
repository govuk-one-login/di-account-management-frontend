import { Request } from "express";
import { getContactEmailServiceUrl } from "../../config";
import { logger } from "../../utils/logger";

export enum ExpectedParams {
  FromURL = "fromURL",
  Theme = "theme",
  AppSessionId = "appSessionId",
  AppErrorCode = "appErrorCode",
}

export const buildContactEmailServiceUrl = (req: Request): URL => {
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
      logger.info(`Missing ${paramValue} in the request or session.`);
    }
  }
  return contactEmailServiceUrl;
};
