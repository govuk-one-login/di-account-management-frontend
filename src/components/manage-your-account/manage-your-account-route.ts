import { initialiseSessionMiddleware } from "../../middleware/session-middleware";
import * as express from "express";
import { manageYourAccountGet} from "./manage-your-account-controller";

const router = express.Router();

router.get("/", initialiseSessionMiddleware, manageYourAccountGet);

export { router as manageYourAccountRouter };
