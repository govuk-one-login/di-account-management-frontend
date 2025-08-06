import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import {
  changeAuthenticatorAppGet,
  changeAuthenticatorAppPost,
} from "./change-authenticator-app-controller";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";

const router = express.Router();

router.get(
  PATH_DATA.CHANGE_AUTHENTICATOR_APP.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  changeAuthenticatorAppGet
);

router.post(
  PATH_DATA.CHANGE_AUTHENTICATOR_APP.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  changeAuthenticatorAppPost
);

export { router as changeAuthenticatorAppRouter };
