import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import {
  addMfaMethodGet,
  addMfaMethodPost,
} from "./add-mfa-methods-controller";

const router = express.Router();

router.get(
  PATH_DATA.ADD_MFA_METHOD.url,
  requiresAuthMiddleware,
  addMfaMethodGet
);

router.post(
  PATH_DATA.ADD_MFA_METHOD.url,
  requiresAuthMiddleware,
  addMfaMethodPost
);

export { router as addMfaMethodRouter };
