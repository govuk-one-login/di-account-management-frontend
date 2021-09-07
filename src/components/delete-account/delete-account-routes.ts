import {PATH_NAMES} from "../../app.constants";

import * as express from "express";
import {deleteAccountGet, deleteAccountPost} from "./delete-account-controller";
import {asyncHandler} from "../../utils/async";

const router = express.Router();

router.get(
    PATH_NAMES.DELETE_ACCOUNT,
    deleteAccountGet
);

router.post(
    PATH_NAMES.DELETE_ACCOUNT,
    asyncHandler(deleteAccountPost())
);

export {router as deleteAccountRouter};
