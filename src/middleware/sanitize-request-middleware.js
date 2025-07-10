import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";
const window = new JSDOM("").window;
const purify = DOMPurify(window);
export function sanitizeRequestMiddleware(req, res, next) {
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
