import * as express from "express";
import { PATH_DATA } from "../../app.constants.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import {
  changeAuthenticatorAppGet,
  changeAuthenticatorAppPost,
} from "./change-authenticator-app-controller.js";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware.js";

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
