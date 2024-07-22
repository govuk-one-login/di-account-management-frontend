import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import {
  changeDefaultMfaMethodGet,
  changeDefaultMfaMethodPost,
} from "./change-default-method-controller";
import { selectMfaMiddleware } from "../../middleware/mfa-method-middleware";

const router = express.Router();

router.get(
  PATH_DATA.CHANGE_DEFAULT_METHOD.url,
  requiresAuthMiddleware,
  selectMfaMiddleware(),
  changeDefaultMfaMethodGet
);

router.post(
  PATH_DATA.CHANGE_DEFAULT_METHOD.url,
  requiresAuthMiddleware,
  changeDefaultMfaMethodPost
);

export { router as changeDefaultMethodRouter };
