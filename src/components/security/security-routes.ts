import * as express from "express";
import { securityGet } from "./security-controller.js";
import { PATH_DATA } from "../../app.constants.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { mfaMethodMiddleware } from "../../middleware/mfa-method-middleware.js";
import { passkeysEnabled } from "../../config.js";

const router = express.Router();

router.get(PATH_DATA.SECURITY.url, [
  requiresAuthMiddleware,
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (passkeysEnabled(req)) {
      next();
      return;
    }
    await mfaMethodMiddleware(req, res, next);
  },
  securityGet,
]);

export { router as securityRouter };
