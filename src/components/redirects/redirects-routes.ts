import * as express from "express";
import { Request, Response } from "express";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";

const router = express.Router();

router.get(
  PATH_DATA.MANAGE_YOUR_ACCOUNT.url,
  requiresAuthMiddleware,
  redirectManageYourAccount
);

async function redirectManageYourAccount(
  req: Request,
  res: Response
): Promise<void> {
  return res.redirect(PATH_DATA.SETTINGS.url);
}

export { router as redirectsRouter };
