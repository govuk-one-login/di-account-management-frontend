import { Request, Response } from "express";

export function robotsTxtGet(req: Request, res: Response) {
  res.send(`user-agent: *
    disallow: /
    allow: /contact-gov-uk-one-login`);
}
