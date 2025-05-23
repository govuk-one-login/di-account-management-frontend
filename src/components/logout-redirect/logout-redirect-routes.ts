import * as express from "express";
import { logoutRedirectGet } from "./logout-redirect-controller";
import { PATH_DATA } from "../../app.constants";
import { globalTryCatchAsync } from "../../utils/global-try-catch";

const router = express.Router();

router.get(
  PATH_DATA.LOGOUT_REDIRECT.url,
  globalTryCatchAsync(logoutRedirectGet)
);

export { router as logoutRedirectRouter };
