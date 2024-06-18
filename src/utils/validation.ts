import { Response, Request } from "express";
import { HTTP_STATUS_CODES } from "../app.constants";

import { Error } from "./types";

export const isObjectEmpty = (obj: Record<string, unknown>): boolean => {
  return Object.keys(obj).length === 0;
};

export function formatValidationError(
  key: string,
  validationMessage: string
): { [k: string]: Error } {
  const error: { [k: string]: Error } = {};
  error[key] = {
    text: validationMessage,
    href: `#${key}`,
  };
  return error;
}

export function generateErrorList(errors: { [k: string]: Error }): Error[] {
  if (!errors) return;
  const errorValues = Object.values(errors);
  const uniqueErrorList = [
    ...new Map(errorValues.map((error) => [error.text, error])).values(),
  ];
  return uniqueErrorList;
}

export function renderBadRequest(
  res: Response,
  req: Request,
  template: string,
  errors: { [k: string]: Error }
): void {
  res.status(HTTP_STATUS_CODES.BAD_REQUEST);

  res.render(template, {
    errors,
    errorList: generateErrorList(errors),
    ...req.body,
    language: req.i18n.language,
  });
}
