import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import {
  enterPasswordPost,
  enterPasswordGet,
} from "./enter-password-controller";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";

const router = express.Router();

router.get(
  PATH_DATA.ENTER_PASSWORD.url,
  requiresAuthMiddleware,
  enterPasswordGet
);

router.post(
  PATH_DATA.ENTER_PASSWORD.url,
  requiresAuthMiddleware,
  enterPasswordPost()
);

export { router as enterPasswordRouter };
