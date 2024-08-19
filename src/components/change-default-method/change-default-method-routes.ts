import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import {
  changeDefaultMethodAppGet,
  changeDefaultMethodAppPost,
  changeDefaultMethodGet,
} from "./change-default-method-controllers";
import { selectMfaMiddleware } from "../../middleware/mfa-method-middleware";

const router = express.Router();

router.get(
  PATH_DATA.CHANGE_DEFAULT_METHOD.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  selectMfaMiddleware(),
  changeDefaultMethodGet
);

router.get(
  PATH_DATA.CHANGE_DEFAULT_METHOD_APP.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  selectMfaMiddleware(),
  changeDefaultMethodAppGet
);

router.post(
  PATH_DATA.CHANGE_DEFAULT_METHOD_APP.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  selectMfaMiddleware(),
  changeDefaultMethodAppPost
);

export { router as changeDefaultMethodRouter };
