import * as express from "express";
import { securityGet } from "./security-controller";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { legacyMfaMethodsMiddleware } from "../../middleware/mfa-methods-legacy";
import { mfaMethodMiddleware } from "../../middleware/mfa-method-middleware";
import { getMfaServiceUrl, supportMfaPage } from "../../config";
import { RequestHandler } from "express";
import { logger } from "../../utils/logger";

const router = express.Router();

const selectMfaMiddleware = (): RequestHandler => {
  try {
    const mfaServiceUrl = new URL(getMfaServiceUrl());
    if (supportMfaPage() && mfaServiceUrl) {
      return mfaMethodMiddleware;
    }
  } catch (e) {
    logger.error(`selectMfaMiddleware ${JSON.stringify(e)}`);
  }
  return legacyMfaMethodsMiddleware;
};

router.get(
  PATH_DATA.SECURITY.url,
  requiresAuthMiddleware,
  selectMfaMiddleware(),
  securityGet
);

export { router as securityRouter };
