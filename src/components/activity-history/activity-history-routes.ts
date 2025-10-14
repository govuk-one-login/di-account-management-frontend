import * as express from "express";
import { activityHistoryGet } from "./activity-history-controller";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";

const router = express.Router();

router.get(
  PATH_DATA.SIGN_IN_HISTORY.url,
  requiresAuthMiddleware,
  activityHistoryGet
);

export { router as activityHistoryRouter };
