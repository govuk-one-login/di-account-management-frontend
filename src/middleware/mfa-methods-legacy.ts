import { NextFunction, Response, Request } from "express";

export function legacyMfaMethodsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.session.user.isPhoneNumberVerified) {
    req.session.mfaMethods = [
      {
        mfaIdentifier: 1,
        priorityIdentifier: "DEFAULT",
        method: {
          mfaMethodType: "SMS",
          endPoint: req.session.user.phoneNumber,
        },
        methodVerified: true,
      },
    ];
  } else {
    req.session.mfaMethods = [
      {
        mfaIdentifier: 1,
        priorityIdentifier: "DEFAULT",
        method: {
          mfaMethodType: "AUTH_APP",
          endPoint: "Authenticator app",
        },
        methodVerified: true,
      },
    ];
  }
  next();
}
