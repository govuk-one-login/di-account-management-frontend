import * as express from "express";
import {
  reportSuspiciousActivityGet,
  reportSuspiciousActivityPost,
  reportSuspiciousActivityConfirmation,
} from "./report-suspicious-activity-controller";
import { PATH_DATA } from "../../app.constants";
import { asyncHandler } from "../../utils/async";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware";
import { checkAllowedServicesList } from "../../middleware/check-allowed-services-list";

const router = express.Router();

router.get(
  PATH_DATA.REPORT_SUSPICIOUS_ACTIVITY.url,
  requiresAuthMiddleware,
  checkAllowedServicesList,
  reportSuspiciousActivityGet
);

router.post(
  PATH_DATA.REPORT_SUSPICIOUS_ACTIVITY.url + "/done",
  requiresAuthMiddleware,
  refreshTokenMiddleware(),
  checkAllowedServicesList,
  asyncHandler(reportSuspiciousActivityPost)
);

router.get(
  PATH_DATA.REPORT_SUSPICIOUS_ACTIVITY.url + "/done",
  requiresAuthMiddleware,
  reportSuspiciousActivityConfirmation
);

export { router as reportSuspiciousActivityRouter };
