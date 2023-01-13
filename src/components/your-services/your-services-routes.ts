import * as express from "express";
import { yourServicesGet } from "./your-services-controller";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";

const router = express.Router();

router.get(
  PATH_DATA.YOUR_SERVICES.url,
  requiresAuthMiddleware,
  yourServicesGet
);

export { router as yourServicesRouter };
