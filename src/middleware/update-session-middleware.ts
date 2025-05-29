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
  paramName: ParamName,
  sessionId: string
) => {
  if (queryParams[paramName]) {
    if (isSafeString(queryParams[paramName] as string)) {
      session.queryParameters[paramName] = queryParams[paramName] as string;
    } else {
      logger.warn(
        { trace: sessionId },
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
  const fromURL: string | undefined = req.query.fromURL as string | undefined;
  const trace = res.locals.sessionId;
  session.queryParameters = {};
  const validatedURL = isValidUrl(fromURL);
  if (validatedURL) {
    session.queryParameters.fromURL = new URL(fromURL).toString();
  } else {
    logger.warn(
      { trace: trace },
      "fromURL in request query for contact-govuk-one-login page did not pass validation:",
      fromURL
    );
  }

  copySafeQueryParamToSession(session, queryParams, "theme", trace);
  copySafeQueryParamToSession(session, queryParams, "appSessionId", trace);
  copySafeQueryParamToSession(session, queryParams, "appErrorCode", trace);

  if (!session.referenceCode) {
    addReferenceCodeAndOwningGSSessionIdToSession();
  }

  if (referenceCodeInSessionWasNotCreatedWhenAGSSessionExisted()) {
    addReferenceCodeAndOwningGSSessionIdToSession();
  }

  if (referenceCodeInSessionWasNotCreatedForThisGSSession()) {
    addReferenceCodeAndOwningGSSessionIdToSession();
  }

  function referenceCodeInSessionWasNotCreatedWhenAGSSessionExisted() {
    return session.referenceCode && !session.referenceCodeOwningSessionId;
  }

  function referenceCodeInSessionWasNotCreatedForThisGSSession() {
    return (
      session.referenceCode &&
      session.referenceCodeOwningSessionId != res.locals.sessionId
    );
  }

  function addReferenceCodeAndOwningGSSessionIdToSession() {
    session.referenceCode = generateReferenceCode();
    session.referenceCodeOwningSessionId = res.locals.sessionId;
  }

  next();
};
