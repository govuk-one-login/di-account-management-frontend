import * as express from "express";
import {
  reportSuspiciousActivityGet,
  reportSuspiciousActivityPost,
  reportSuspiciousActivityConfirmation,
} from "./report-suspicious-activity-controller.js";
import { PATH_DATA } from "../../app.constants.js";
import { asyncHandler } from "../../utils/async.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { checkRSAAllowedServicesList } from "../../middleware/check-allowed-services-list.js";

const router = express.Router();

router.get(
  PATH_DATA.REPORT_SUSPICIOUS_ACTIVITY.url,
  requiresAuthMiddleware,
  checkRSAAllowedServicesList,
  reportSuspiciousActivityGet
);

router.post(
  PATH_DATA.REPORT_SUSPICIOUS_ACTIVITY.url + "/done",
  requiresAuthMiddleware,
  checkRSAAllowedServicesList,
  asyncHandler(reportSuspiciousActivityPost)
);

router.get(
  PATH_DATA.REPORT_SUSPICIOUS_ACTIVITY.url + "/done",
  requiresAuthMiddleware,
  checkRSAAllowedServicesList,
  reportSuspiciousActivityConfirmation
);

export { router as reportSuspiciousActivityRouter };
