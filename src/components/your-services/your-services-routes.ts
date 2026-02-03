import * as express from "express";
import { yourServicesGet } from "./your-services-controller.js";
import { PATH_DATA } from "../../app.constants.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";

const router = express.Router();

router.get(
  PATH_DATA.YOUR_SERVICES.url,
  requiresAuthMiddleware,
  yourServicesGet
);

export { router as yourServicesRouter };
