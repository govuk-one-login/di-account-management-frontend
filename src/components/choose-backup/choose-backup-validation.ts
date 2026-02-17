import { body, ValidationChain } from "express-validator";
import { validateBodyMiddleware } from "../../middleware/form-validation-middleware.js";
import { Request, Response, NextFunction } from "express";

export function validateChooseBackupRequest(): (
  | ValidationChain
  | ((req: Request, res: Response, next: NextFunction) => void)
)[] {
  const addBackupValidation: ValidationChain = body("addBackup")
    .notEmpty()
    .withMessage((value, { req }) =>
      req.t("pages.addBackup.errors.required", { value })
    );

  const handleValidationErrors = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const options = {
      mfaMethods: req.session.mfaMethods || [],
    };
    validateBodyMiddleware("choose-backup/index.njk", options)(req, res, next);
  };

  return [addBackupValidation, handleValidationErrors];
}
