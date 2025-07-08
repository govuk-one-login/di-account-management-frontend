import * as express from "express";
import {
  reportSuspiciousActivityGet,
  reportSuspiciousActivityPost,
  reportSuspiciousActivityConfirmationGet,
} from "./report-suspicious-activity-controller";
import { PATH_DATA } from "../../app.constants";
import { asyncHandler } from "../../utils/async";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { checkRSAAllowedServicesList } from "../../middleware/check-allowed-services-list";
import { globalTryCatchAsync } from "../../utils/global-try-catch";

const router = express.Router();

router.get(
  PATH_DATA.REPORT_SUSPICIOUS_ACTIVITY.url,
  requiresAuthMiddleware,
  checkRSAAllowedServicesList,
  globalTryCatchAsync(reportSuspiciousActivityGet)
);

router.post(
  PATH_DATA.REPORT_SUSPICIOUS_ACTIVITY.url + "/done",
  requiresAuthMiddleware,
  checkRSAAllowedServicesList,
  globalTryCatchAsync(asyncHandler(reportSuspiciousActivityPost))
);

router.get(
  PATH_DATA.REPORT_SUSPICIOUS_ACTIVITY.url + "/done",
  requiresAuthMiddleware,
  checkRSAAllowedServicesList,
  reportSuspiciousActivityConfirmationGet
);

export { router as reportSuspiciousActivityRouter };
