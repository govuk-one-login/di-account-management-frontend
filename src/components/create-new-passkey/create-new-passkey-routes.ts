import * as express from "express";
import { createNewPasskeyGet } from "./create-new-passkey-controller.js";
import { PATH_DATA } from "../../app.constants.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware.js";
import { passkeysEnabled } from "../../config.js";

const router = express.Router();

router.get(
  PATH_DATA.CREATE_NEW_PASSKEY.url,
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!passkeysEnabled(req)) {
      res.status(404);
      res.send();
      return;
    }
    next();
  },
  requiresAuthMiddleware,
  validateStateMiddleware,
  createNewPasskeyGet
);

export { router as createNewPasskeyRouter };
