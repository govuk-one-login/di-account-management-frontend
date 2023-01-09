import * as express from "express";
import { manageYourAccountGet } from "./manage-your-account-controller";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";

const router = express.Router();

router.get(
  PATH_DATA.SETTINGS.url,
  requiresAuthMiddleware,
  manageYourAccountGet
);

export { router as manageYourAccountRouter };
