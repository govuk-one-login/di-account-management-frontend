import { Session } from "express-session";
import { NextFunction, Request, Response } from "express";
import { Middleware } from "express-validator/src/base";

export function testComponent(componentId: string): string {
  return `[data-test-id='${componentId}']`;
}
export function mockSessionMiddleware(
  sessionData: Partial<Session>
): Middleware {
  return function (req: Request, res: Response, next: NextFunction) {
    req.session = sessionData as Session;
    next();
  };
}
