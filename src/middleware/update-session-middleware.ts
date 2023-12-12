import { NextFunction, Request, Response } from "express";
import { Session } from "express-session";
import { ParamName } from "../app.constants";
import { isSafeString, isValidUrl } from "../utils/strings";
import { logger } from "../utils/logger";
import { generateReferenceCode } from "../utils/referenceCode";
import { ParsedQs } from "qs";

const copySafeQueryParamToSession = (
  session: Session,
  queryParams: ParsedQs,
  paramName: ParamName
) => {
  if (queryParams[paramName]) {
    if (isSafeString(queryParams[paramName] as string)) {
      session.queryParameters[paramName] = queryParams[paramName] as string;
    } else {
      logger.error(
        `${paramName} in request query for contact-govuk-one-login page did not pass validation`
      );
    }
  }
};

export const updateSessionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const session = req.session;
  const queryParams = req.query;
  const { fromURL } = queryParams;
  session.queryParameters = {};

  if (fromURL) {
    if (isValidUrl(fromURL)) {
      session.queryParameters.fromURL = fromURL as string;
    } else {
      logger.error(
        "fromURL in request query for contact-govuk-one-login page did not pass validation"
      );
    }
  }

  copySafeQueryParamToSession(session, queryParams, "theme");
  copySafeQueryParamToSession(session, queryParams, "appSessionId");
  copySafeQueryParamToSession(session, queryParams, "appErrorCode");

  if (!session.referenceCode) {
    session.referenceCode = generateReferenceCode();
  }

  next();
};
