import * as express from "express";
import {
  reportSuspiciousActivityGet,
  reportSuspiciousActivityPost,
  reportSuspiciousActivityConfirmation,
} from "./report-suspicious-activity-controller";
import { PATH_DATA } from "../../app.constants";
import { asyncHandler } from "../../utils/async";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { checkRSAAllowedServicesList } from "../../middleware/check-allowed-services-list";
import { globalTryCatch } from "../../utils/global-try-catch";

const router = express.Router();

router.get(
  PATH_DATA.REPORT_SUSPICIOUS_ACTIVITY.url,
  requiresAuthMiddleware,
  checkRSAAllowedServicesList,
  globalTryCatch(reportSuspiciousActivityGet)
);

router.post(
  PATH_DATA.REPORT_SUSPICIOUS_ACTIVITY.url + "/done",
  requiresAuthMiddleware,
  checkRSAAllowedServicesList,
  globalTryCatch(asyncHandler(reportSuspiciousActivityPost))
);

router.get(
  PATH_DATA.REPORT_SUSPICIOUS_ACTIVITY.url + "/done",
  requiresAuthMiddleware,
  checkRSAAllowedServicesList,
  reportSuspiciousActivityConfirmation
);

export { router as reportSuspiciousActivityRouter };
