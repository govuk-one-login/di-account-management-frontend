import * as express from "express";
import { signInDetailsGet } from "./sign-in-details-controller.js";
import { PATH_DATA } from "../../app.constants.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { mfaMethodMiddleware } from "../../middleware/mfa-method-middleware.js";
import { passkeysEnabled } from "../../config.js";

const router = express.Router();

router.get(
  PATH_DATA.SIGN_IN_DETAILS.url,
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!passkeysEnabled(req)) {
      res.status(404);
      res.send();
      return;
    }
    next();
  },
  requiresAuthMiddleware,
  mfaMethodMiddleware,
  signInDetailsGet
);

export { router as signInDetailsRouter };
