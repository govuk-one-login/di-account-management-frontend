import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types.js";
import { ChangeEmailServiceInterface } from "./types.js";
import { changeEmailService } from "./change-email-service.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import {
  badRequest,
  setLocalOplSettings,
  handleEmailVerificationSubmission,
} from "./change-email-utils.js";

const TEMPLATE_NAME = "change-email/index.njk";
const OPL_CONTENT_ID = "1f97b62b-a124-4d6a-ae51-8abd2611ec55";

export function changeEmailGet(req: Request, res: Response): void {
  req.metrics?.addMetric("changeEmailGet", MetricUnit.Count, 1);
  if (req.query.email_cant_be_used === "1") {
    return badRequest(
      req,
      res,
      "emailCantBeUsed",
      TEMPLATE_NAME,
      OPL_CONTENT_ID
    );
  }
  setLocalOplSettings(res, OPL_CONTENT_ID);
  return res.render(TEMPLATE_NAME);
}

export function changeEmailPost(
  service: ChangeEmailServiceInterface = changeEmailService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    req.metrics?.addMetric("changeEmailPost", MetricUnit.Count, 1);

    return handleEmailVerificationSubmission({
      req,
      res,
      service,
      newEmailAddress: req.body.email,
      templateName: TEMPLATE_NAME,
      oplContentId: OPL_CONTENT_ID,
    });
  };
}
