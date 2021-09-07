import * as express from "express";
import { manageYourAccountGet } from "./manage-your-account-controller";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";

const router = express.Router();

router.get(
  PATH_DATA.MANAGE_YOUR_ACCOUNT.url,
  requiresAuthMiddleware,
  manageYourAccountGet
);

export { router as manageYourAccountRouter };
