import * as express from "express";
import { manageYourAccountGet } from "./manage-your-account-controller";
import { PATH_NAMES } from "../../app.constants";

const router = express.Router();

router.get(PATH_NAMES.MANAGE_YOUR_ACCOUNT, manageYourAccountGet);

export { router as manageYourAccountRouter };
