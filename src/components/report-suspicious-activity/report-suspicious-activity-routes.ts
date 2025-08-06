import * as express from "express";
import {
  reportSuspiciousActivityGet,
  reportSuspiciousActivityPost,
  reportSuspiciousActivityConfirmationGet,
} from "./report-suspicious-activity-controller";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { checkRSAAllowedServicesList } from "../../middleware/check-allowed-services-list";

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
  reportSuspiciousActivityPost
);

router.get(
  PATH_DATA.REPORT_SUSPICIOUS_ACTIVITY.url + "/done",
  requiresAuthMiddleware,
  checkRSAAllowedServicesList,
  reportSuspiciousActivityConfirmationGet
);

export { router as reportSuspiciousActivityRouter };
