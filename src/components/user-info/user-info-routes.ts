import * as express from "express";
import { userInfoGet } from "./user-info-controller";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";

const router = express.Router();

router.get(
  "/dump",
  requiresAuthMiddleware,
  userInfoGet
);

export { router as userinfoRouter };
