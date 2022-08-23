import { PATH_DATA } from "../../app.constants"

import * as express from "express";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import {
  securityCodeInvalidGet,
} from "./security-code-error-controller";

const router = express.Router();

router.get(
    PATH_DATA.SECURITY_CODE_INVALID.url,
    requiresAuthMiddleware,
    securityCodeInvalidGet
);



export { router as securityCodeErrorRouter };
