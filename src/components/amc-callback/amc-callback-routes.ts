import * as express from "express";
import { amcCallbackGet } from "./amc-callback-controller.js";
import { PATH_DATA } from "../../app.constants.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware.js";

const router = express.Router();

router.get(
  PATH_DATA.AMC_CALLBACK.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  amcCallbackGet
);

export { router as amcCallbackRouter };
