import * as express from "express";
import { activityHistoryGet } from "./activity-history-controller";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { checkActivityLogAllowedServicesList } from "../../middleware/check-allowed-services-list";
import { globalTryCatchAsync } from "../../utils/global-try-catch";

const router = express.Router();

router.get(
  PATH_DATA.SIGN_IN_HISTORY.url,
  requiresAuthMiddleware,
  checkActivityLogAllowedServicesList,
  globalTryCatchAsync(activityHistoryGet)
);

export { router as activityHistoryRouter };
