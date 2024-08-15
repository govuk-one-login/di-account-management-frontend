import { NextFunction, Request, Response } from "express";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";

const window = new JSDOM("").window;
const purify = DOMPurify(window);

export function sanitizeRequestMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.body) {
    Object.keys(req.body).forEach((formParameter) => {
      req.body[formParameter] = purify
        .sanitize(req.body[formParameter], {
          ALLOWED_TAGS: [],
        })
        .trim();
    });
  }

  next();
}
