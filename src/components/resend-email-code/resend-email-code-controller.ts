import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types.js";
import { ChangeEmailServiceInterface } from "../change-email/types.js";
import { changeEmailService } from "../change-email/change-email-service.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import {
  setLocalOplSettings,
  handleEmailVerificationSubmission,
} from "../change-email/change-email-utils.js";

const TEMPLATE_NAME = "resend-email-code/index.njk";
const OPL_CONTENT_ID = "24ad9e0f-9d6f-43d2-8828-5d8f2003c6fe";

export function resendEmailCodeGet(req: Request, res: Response): void {
  req.metrics?.addMetric("resendEmailCodeGet", MetricUnit.Count, 1);
  setLocalOplSettings(res, OPL_CONTENT_ID);
  res.render(TEMPLATE_NAME, {
    emailAddress: req.session.user.newEmailAddress,
  });
}

export function resendEmailCodePost(
  service: ChangeEmailServiceInterface = changeEmailService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    req.metrics?.addMetric("resendEmailCodePost", MetricUnit.Count, 1);

    return handleEmailVerificationSubmission({
      req,
      res,
      service,
      newEmailAddress: req.session.user.newEmailAddress,
      templateName: TEMPLATE_NAME,
      oplContentId: OPL_CONTENT_ID,
    });
  };
}
