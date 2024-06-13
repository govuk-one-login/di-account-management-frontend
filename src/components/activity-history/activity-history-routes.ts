import * as express from "express";
import { activityHistoryGet } from "./activity-history-controller.js";
import { PATH_DATA } from "../../app.constants.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { checkRSAAllowedServicesList } from "../../middleware/check-allowed-services-list.js";

const router = express.Router();

router.get(
  PATH_DATA.SIGN_IN_HISTORY.url,
  requiresAuthMiddleware,
  checkRSAAllowedServicesList,
  activityHistoryGet
);

export { router as activityHistoryRouter };
