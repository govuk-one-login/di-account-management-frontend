import { PATH_DATA } from "../../app.constants";
import * as express from "express";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { permanentlyBlockedGet } from "./permanently-blocked-controller";

const router = express.Router();

router.get(
  PATH_DATA.UNAVAILABLE_PERMANENT.url,
  requiresAuthMiddleware,
  permanentlyBlockedGet
);

export { router as permanentlyBlockedRouter };
