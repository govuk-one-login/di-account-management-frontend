import { NextFunction, Request, Response } from "express";
import { ValidationError, validationResult } from "express-validator";
import { isObjectEmpty, renderBadRequest } from "../utils/validation.js";

import { Error } from "../utils/types.js";

export function validationErrorFormatter(error: ValidationError): Error {
  switch (error.type) {
    case "alternative":
      return validationErrorFormatter(error.nestedErrors[0]);

    case "alternative_grouped":
      return validationErrorFormatter(error.nestedErrors[0][0]);

    case "field":
      return {
        text: error.msg,
        href: `#${error.path}`,
      };
  }
}

export function validateBodyMiddleware(template: string, options?: object) {
  return (req: Request, res: Response, next: NextFunction): any => {
    const errors = validationResult(req)
      .formatWith(validationErrorFormatter)
      .mapped();

    if (!isObjectEmpty(errors)) {
      return renderBadRequest(res, req, template, errors, options);
    }
    next();
  };
}
