import { Session } from "express-session";
import { NextFunction, Request, RequestHandler, Response } from "express";

export function testComponent(componentId: string): string {
  return `[data-test-id='${componentId}']`;
}
export function mockSessionMiddleware(
  sessionData: Partial<Session>
): RequestHandler {
  return function (req: Request, res: Response, next: NextFunction) {
    req.session = sessionData as Session;
    next();
  };
}
