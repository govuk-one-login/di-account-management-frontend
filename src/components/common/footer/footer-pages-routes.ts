import { PATH_DATA } from "../../../app.constants";
import {
  accessibilityStatementGet,
  privacyStatementGet,
  termsConditionsGet,
} from "./footer-pages-controller";

import * as express from "express";

const router = express.Router();

router.get(PATH_DATA.ACCESSIBILITY_STATEMENT.url, accessibilityStatementGet);
router.get(PATH_DATA.PRIVACY_POLICY.url, privacyStatementGet);
router.get(PATH_DATA.TERMS_AND_CONDITIONS.url, termsConditionsGet);

export { router as footerRouter };
