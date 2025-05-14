import { PATH_DATA } from "../../app.constants";
import * as express from "express";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { temporarilyBlockedGet } from "./temporarily-blocked-controller";
const router = express.Router();

router.get(
  PATH_DATA.UNAVAILABLE_TEMPORARY.url,
  requiresAuthMiddleware,
  temporarilyBlockedGet
);

export { router as temporarilyBlockedRouter };
