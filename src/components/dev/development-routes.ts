import * as express from "express";
import { missingTranslationsGet } from "./development-controllers";

const router = express.Router();

router.get("/-missing-translations", missingTranslationsGet);

export { router as developmentRouter };
