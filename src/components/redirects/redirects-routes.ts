import * as express from "express";
import { Request, Response } from "express";
import { PATH_DATA, WELL_KNOWN_FILES } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";

const router = express.Router();

router.get(
  [PATH_DATA.MANAGE_YOUR_ACCOUNT.url, PATH_DATA.SETTINGS.url],
  requiresAuthMiddleware,
  redirectToSecurity
);

router.get(PATH_DATA.SECURITY_TXT.url, (_, res) =>
  res.redirect(302, WELL_KNOWN_FILES.SECURITY_TEXT_URL)
);

router.get(PATH_DATA.THANKS_TXT.url, (_, res) =>
  res.redirect(302, WELL_KNOWN_FILES.THANKS_TEXT_URL)
);

function redirectToSecurity(req: Request, res: Response) {
  return res.redirect(PATH_DATA.SECURITY.url);
}

export { router as redirectsRouter };
